const chatService = require('./chat.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const chatController = {
  createChat: asyncHandler(async (req, res) => {
    const chat = await chatService.createChat(req.user._id, req.body);
    return res.status(201).json(new ApiResponse(201, chat, 'Conversation created successfully'));
  }),

  getChats: asyncHandler(async (req, res) => {
    const chats = await chatService.getChats(req.user._id);
    return res.status(200).json(new ApiResponse(200, chats, 'Conversations retrieved successfully'));
  }),

  getChatById: asyncHandler(async (req, res) => {
    const chat = await chatService.getChatById(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, chat, 'Conversation retrieved successfully'));
  }),

  deleteChat: asyncHandler(async (req, res) => {
    const result = await chatService.deleteChat(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const result = await chatService.sendMessage(req.user._id, req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, result, 'Message sent successfully'));
  }),

  getMessages: asyncHandler(async (req, res) => {
    const messages = await chatService.getMessages(req.user._id, req.params.id);
    return res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved successfully'));
  }),

  uploadAttachment: asyncHandler(async (req, res) => {
    const attachment = await chatService.uploadAttachment(req.user._id, req.params.id, req.file);
    return res.status(200).json(new ApiResponse(200, attachment, 'Attachment uploaded successfully'));
  }),
};

module.exports = chatController;
