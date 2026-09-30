const Chat = require('./chat.model');
const aiService = require('../../services/ai/ai.service');
const contextService = require('../../services/ai/context.service');
const cloudinaryService = require('../../services/storage/cloudinary.service');
const ragService = require('../../services/rag/rag.service');
const pdfParser = require('../resume/resume.parser');
const ApiError = require('../../utils/ApiError');

const chatService = {
  /**
   * Starts a new chat session
   */
  async createChat(userId, { title, topic, includeResumeContext = true, resumeId = null }) {
    const chat = await Chat.create({
      userId,
      title: title || 'New Conversation',
      topic: topic || 'General Career Prep',
      includeResumeContext,
      resumeId,
      messages: [],
    });
    return chat;
  },

  /**
   * Lists all chats for user
   */
  async getChats(userId) {
    return Chat.find({ userId })
      .select('title topic lastMessageAt createdAt updatedAt')
      .sort({ lastMessageAt: -1 });
  },

  /**
   * Retrieves single chat with ownership check
   */
  async getChatById(userId, chatId) {
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      throw ApiError.notFound('Conversation not found', 'CHAT_NOT_FOUND');
    }
    return chat;
  },

  /**
   * Deletes a chat
   */
  async deleteChat(userId, chatId) {
    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });
    if (!chat) {
      throw ApiError.notFound('Conversation not found', 'CHAT_NOT_FOUND');
    }
    return { message: 'Conversation deleted successfully' };
  },

  /**
   * Sends user message, builds context, and generates/streams AI response
   */
  async sendMessage(userId, chatId, { content, attachments = [] }) {
    const chat = await this.getChatById(userId, chatId);

    // 1. Append user message
    const userMessage = {
      role: 'user',
      content,
      attachments,
      timestamp: new Date(),
    };
    chat.messages.push(userMessage);

    // If chat title is default and this is first message, generate title from content
    if (chat.title === 'New Conversation') {
      chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    // 2. Build AI Context (User profile, Resume, RAG chunks)
    const context = await contextService.build({
      userId,
      mode: 'chat',
      topic: chat.topic,
      query: content,
      resumeId: chat.includeResumeContext ? chat.resumeId : null,
    });

    // 3. Assemble Prompt Messages
    const systemPrompt = `You are HelloBuddy, an elite AI Career Prep Advisor and Technical Interview Coach.
${context.user?.name ? `User Name: ${context.user.name}` : ''}
${context.user?.targetRole ? `Target Role: ${context.user.targetRole}` : ''}
Topic: ${chat.topic}

${context.resumeSummary ? `\n[CANDIDATE RESUME PROFILE]:\n${context.resumeSummary}\n` : ''}
${context.relevantChunks ? `\n[RELEVANT KNOWLEDGE CHUNKS]:\n${context.relevantChunks}\n` : ''}

Respond thoroughly, concisely, and insightfully with clear explanations, structured bullet points, and code snippets where relevant.`;

    const recentHistory = chat.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages = [{ role: 'system', content: systemPrompt }, ...recentHistory];

    // 4. Generate AI response
    const assistantContent = await aiService.generateText({ messages });

    const assistantMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    };
    chat.messages.push(assistantMessage);
    chat.lastMessageAt = new Date();

    await chat.save();

    return {
      userMessage,
      assistantMessage,
      chatId: chat._id,
    };
  },

  /**
   * Uploads an attachment to a chat conversation
   */
  async uploadAttachment(userId, chatId, file) {
    const chat = await this.getChatById(userId, chatId);
    if (!file) throw ApiError.badRequest('No file provided');

    const isPdf = file.mimetype === 'application/pdf';
    const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'chat_attachments',
      resourceType: isPdf ? 'raw' : 'image',
      filename: file.originalname,
    });

    const attachment = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      name: file.originalname,
      fileType: isPdf ? 'pdf' : 'image',
      size: file.size,
    };

    // If PDF, extract and index in RAG
    if (isPdf) {
      setImmediate(async () => {
        try {
          const text = await pdfParser.extractTextFromPdf(file.buffer);
          await ragService.ingestDocument({
            userId,
            text,
            sourceType: 'pdf',
            sourceId: chat._id,
            documentId: uploadResult.publicId,
          });
        } catch (err) {
          // ignore background ingestion failure
        }
      });
    }

    return attachment;
  },

  /**
   * Retrieves messages for a chat
   */
  async getMessages(userId, chatId) {
    const chat = await this.getChatById(userId, chatId);
    return chat.messages;
  },
};

module.exports = chatService;
