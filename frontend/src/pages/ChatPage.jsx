import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  Paperclip, 
  FileText, 
  Sparkles, 
  User, 
  Bot,
  AlertCircle
} from 'lucide-react';

export default function ChatPage() {
  const { isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [inputContent, setInputContent] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await chatApi.getChats();
      const list = res?.data || [];
      setChats(list);
      if (list.length > 0 && !activeChat) {
        selectChat(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const selectChat = async (chatId) => {
    setError(null);
    try {
      const chatRes = await chatApi.getChatById(chatId);
      setActiveChat(chatRes?.data);
      const msgRes = await chatApi.getMessages(chatId);
      setMessages(msgRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load conversation.');
    }
  };

  const handleCreateChat = async () => {
    setError(null);
    try {
      const res = await chatApi.createChat({
        title: 'New Conversation',
        topic: 'General Career Prep & Technical Guidance',
      });
      const newChat = res?.data;
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);
    } catch (err) {
      setError(err.message || 'Failed to create chat.');
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await chatApi.deleteChat(chatId);
      const remaining = chats.filter((c) => c._id !== chatId);
      setChats(remaining);
      if (activeChat?._id === chatId) {
        if (remaining.length > 0) {
          selectChat(remaining[0]._id);
        } else {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete chat.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeChat || sending) return;

    const userText = inputContent.trim();
    setInputContent('');
    setError(null);
    setSending(true);

    // Optimistically show user message
    const tempUserMsg = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatApi.sendMessage(activeChat._id, { content: userText });
      const assistantMsg = res?.data?.assistantMessage;
      if (assistantMsg) {
        setMessages((prev) => [...prev, assistantMsg]);
      }
      fetchChats();
    } catch (err) {
      setError(err.message || 'Failed to get response from AI.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await chatApi.uploadAttachment(activeChat._id, formData);
      const attachment = res?.data;
      // Send a follow up prompt noting the upload
      await chatApi.sendMessage(activeChat._id, {
        content: `I have uploaded an attachment: "${attachment?.name}". Please inspect and advise.`,
        attachments: [attachment],
      });
      selectChat(activeChat._id);
    } catch (err) {
      setError(err.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Career Assistant</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2 text-sm">
          Chat freely with your personal career coach, get code guidance, resume tips, and strategy advice.
        </p>
        <button
          onClick={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          className="mt-6 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          Sign In to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[750px] flex">
        {/* Sidebar: Conversation List */}
        <div className="w-72 sm:w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Conversations</h3>
            <button
              onClick={handleCreateChat}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => selectChat(chat._id)}
                className={`p-3 rounded-xl cursor-pointer text-xs transition flex items-center justify-between group ${
                  activeChat?._id === chat._id
                    ? 'bg-white font-bold text-indigo-900 border border-indigo-200 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="truncate">{chat.title}</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                    {new Date(chat.lastMessageAt || chat.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {chats.length === 0 && !loadingChats && (
              <div className="text-center py-8 text-xs text-gray-400">
                No conversations yet. Click + to begin!
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{activeChat.title}</h4>
                  <p className="text-[11px] text-gray-400">{activeChat.topic}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                  Powered by Groq LLM
                </span>
              </div>

              {error && (
                <div className="m-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto text-indigo-400 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-gray-600">Start the conversation</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Ask about interview answers, technical concepts, resume critiques, or salary negotiations.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}

                      {/* Display attachments if any */}
                      {msg.attachments?.map((att, aIdx) => (
                        <div key={aIdx} className="mt-2 p-2 rounded bg-black/10 flex items-center gap-2 text-xs">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-center gap-3 text-xs text-gray-400 pl-2">
                    <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span>HelloBuddy is thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Upload file (PDF/Image)"
                    className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                  >
                    <Paperclip className={`w-4 h-4 ${uploading ? 'animate-pulse text-indigo-600' : ''}`} />
                  </button>

                  <input
                    type="text"
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder="Ask HelloBuddy anything..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || !inputContent.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-400">
              <div>
                <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Select or Start a Conversation</p>
                <button
                  onClick={handleCreateChat}
                  className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Create New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
