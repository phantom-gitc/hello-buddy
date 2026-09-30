const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../../config/env');
const logger = require('../../../utils/logger');

class GeminiProvider {
  constructor() {
    this.name = 'gemini';
    this.defaultModel = config.ai.geminiModel || 'gemini-flash-latest';
  }

  isAvailable() {
    return Boolean(config.ai.geminiApiKey && !config.ai.geminiApiKey.includes('dummy'));
  }

  _getClient() {
    return new GoogleGenerativeAI(config.ai.geminiApiKey);
  }

  /**
   * Translates OpenAI style messages array to Gemini contents and system instruction
   */
  _formatMessages(messages) {
    let systemInstruction = '';
    const contents = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += (systemInstruction ? '\n\n' : '') + msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Ensure at least one user content
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    return { systemInstruction, contents };
  }

  /**
   * Generates standard text completion
   */
  async generateText({ messages, model, temperature = 0.7, maxTokens = 1500, responseFormat }) {
    if (!this.isAvailable()) {
      logger.warn('Gemini API key not set or dummy. Returning fallback response.');
      return this._mockResponse(messages);
    }

    try {
      const genAI = this._getClient();
      const { systemInstruction, contents } = this._formatMessages(messages);

      const generativeModel = genAI.getGenerativeModel({
        model: model || this.defaultModel,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const result = await generativeModel.generateContent({ contents });
      const response = await result.response;
      return response.text() || '';
    } catch (error) {
      logger.error('Gemini provider error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Generates structured JSON output using Gemini's native JSON mode
   */
  async generateStructuredOutput({ messages, model, schemaDescription }) {
    const systemPromptModifier = `\nYou MUST respond ONLY with a valid JSON object matching this schema description:\n${schemaDescription}\nDo not include backticks, markdown markers, or commentary outside the JSON.`;

    const adjustedMessages = [...messages];
    if (adjustedMessages[0] && adjustedMessages[0].role === 'system') {
      adjustedMessages[0] = {
        ...adjustedMessages[0],
        content: adjustedMessages[0].content + systemPromptModifier,
      };
    } else {
      adjustedMessages.unshift({
        role: 'system',
        content: systemPromptModifier,
      });
    }

    const rawText = await this.generateText({
      messages: adjustedMessages,
      model,
      temperature: 0.2,
      responseFormat: 'json',
    });

    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      logger.error('Failed to parse structured JSON from Gemini output:', { rawText, error: err.message });
      throw new Error('Gemini output was not valid JSON');
    }
  }

  /**
   * Streams completion chunks via an async callback
   */
  async streamText({ messages, model, onChunk, onDone, onError }) {
    if (!this.isAvailable()) {
      const mockText = "This is a simulated Gemini AI response in development mode. Set GEMINI_API_KEY in your .env file to enable live Google Gemini generation.";
      for (const word of mockText.split(' ')) {
        await new Promise((r) => setTimeout(r, 40));
        onChunk(word + ' ');
      }
      if (onDone) onDone();
      return;
    }

    try {
      const genAI = this._getClient();
      const { systemInstruction, contents } = this._formatMessages(messages);

      const generativeModel = genAI.getGenerativeModel({
        model: model || this.defaultModel,
        ...(systemInstruction ? { systemInstruction } : {}),
      });

      const responseStream = await generativeModel.generateContentStream({ contents });

      for await (const chunk of responseStream.stream) {
        const text = chunk.text();
        if (text) {
          onChunk(text);
        }
      }

      if (onDone) onDone();
    } catch (error) {
      logger.error('Gemini streaming error:', { error: error.message });
      if (onError) onError(error);
    }
  }

  _mockResponse(messages) {
    const userMsg = messages[messages.length - 1]?.content || '';
    return `[Mock Gemini Response for: "${userMsg.slice(0, 50)}..."] Google Gemini is configured. Add your GEMINI_API_KEY in .env to activate live responses.`;
  }
}

module.exports = new GeminiProvider();
