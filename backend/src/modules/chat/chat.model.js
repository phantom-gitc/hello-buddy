const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        url: String,
        publicId: String,
        name: String,
        fileType: { type: String, enum: ['image', 'pdf', 'audio', 'doc'] },
        size: Number,
      },
    ],
    tokensUsed: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    topic: {
      type: String,
      default: 'General Career Prep',
    },
    includeResumeContext: {
      type: Boolean,
      default: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user chats
chatSchema.index({ userId: 1, lastMessageAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
