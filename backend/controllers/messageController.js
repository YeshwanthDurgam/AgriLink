const Message = require('../models/Message');
const User = require('../models/User');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

// Send a message (admin <-> farmer)
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, senderRole, receiverRole, content } = req.body;
    if (!senderId || !receiverId || !senderRole || !receiverRole || !content) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      senderRole,
      receiverRole,
      content,
    });
    res.status(201).json({ message: 'Message sent.', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.', error: err.message });
  }
};

// Get all conversations for a user (admin or farmer)
exports.getConversations = async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId || !role) {
      return res.status(400).json({ message: 'Missing userId or role.' });
    }
    // Find all unique conversation partners
    const sent = await Message.find({ sender: userId, senderRole: role })
      .distinct('receiver');
    const received = await Message.find({ receiver: userId, receiverRole: role })
      .distinct('sender');
    const partnerIds = Array.from(new Set([...sent, ...received]));
    // Get latest message for each conversation
    const conversations = await Promise.all(partnerIds.map(async (partnerId) => {
      const lastMsg = await Message.findOne({
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ],
      }).sort({ createdAt: -1 });
      return lastMsg;
    }));
    res.json({ data: conversations.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get conversations.', error: err.message });
  }
};

// Get all messages in a conversation (admin <-> farmer)
exports.getMessagesInConversation = async (req, res) => {
  try {
    const { userId, partnerId } = req.query;
    if (!userId || !partnerId) {
      return res.status(400).json({ message: 'Missing userId or partnerId.' });
    }
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages.', error: err.message });
  }
}; 