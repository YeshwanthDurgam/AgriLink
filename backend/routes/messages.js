const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Send a message
router.post('/', messageController.sendMessage);

// Get all conversations for a user
router.get('/conversations', messageController.getConversations);

// Get all messages in a conversation
router.get('/', messageController.getMessagesInConversation);

// Mark all messages as read for a conversation
router.post('/mark-read', messageController.markMessagesAsRead);

module.exports = router; 