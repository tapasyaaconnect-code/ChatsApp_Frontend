/**
 * Format timestamp to readable time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  // Today: show time only
  if (diffInHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday: show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }
  
  // This year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Different year: show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Format date for message grouping
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date string
 */
export const formatMessageDate = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Group messages by date
 * @param {Array} messages - Array of message objects
 * @returns {Object} Messages grouped by date
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const dateKey = formatMessageDate(message.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return groups;
};

/**
 * Check if two consecutive messages are from same user
 * @param {Object} currentMsg - Current message
 * @param {Object} prevMsg - Previous message
 * @returns {boolean} True if messages are from same user
 */
export const isSameUser = (currentMsg, prevMsg) => {
  if (!prevMsg || !currentMsg) return false;
  return currentMsg.senderId === prevMsg.senderId;
};

/**
 * Check if messages are close in time (within 5 minutes)
 * @param {Object} currentMsg - Current message
 * @param {Object} prevMsg - Previous message
 * @returns {boolean} True if messages are close in time
 */
export const isCloseTime = (currentMsg, prevMsg) => {
  if (!prevMsg || !currentMsg) return false;
  const currentTime = new Date(currentMsg.timestamp).getTime();
  const prevTime = new Date(prevMsg.timestamp).getTime();
  const timeDiff = (currentTime - prevTime) / (1000 * 60); // in minutes
  return timeDiff < 5;
};

/**
 * Should show avatar for message
 * @param {Object} message - Current message
 * @param {Object} prevMessage - Previous message
 * @returns {boolean} True if avatar should be shown
 */
export const shouldShowAvatar = (message, prevMessage) => {
  return !isSameUser(message, prevMessage);
};

/**
 * Should show timestamp for message
 * @param {Object} message - Current message
 * @param {Object} nextMessage - Next message
 * @returns {boolean} True if timestamp should be shown
 */
export const shouldShowTimestamp = (message, nextMessage) => {
  if (!nextMessage) return true;
  if (!isSameUser(message, nextMessage)) return true;
  if (!isCloseTime(nextMessage, message)) return true;
  return false;
};

/**
 * Truncate long text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate message content
 * @param {string} message - Message content
 * @returns {Object} Validation result
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 5000) {
    return { isValid: false, error: 'Message is too long (max 5000 characters)' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Sanitize message content (basic XSS prevention)
 * @param {string} message - Message content
 * @returns {string} Sanitized message
 */
export const sanitizeMessage = (message) => {
  if (!message) return '';
  
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Extract mentions from message
 * @param {string} message - Message content
 * @returns {Array} Array of mentioned usernames
 */
export const extractMentions = (message) => {
  if (!message) return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Highlight mentions in message
 * @param {string} message - Message content
 * @returns {string} Message with highlighted mentions
 */
export const highlightMentions = (message) => {
  if (!message) return '';
  
  return message.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
};

/**
 * Generate unique message ID
 * @returns {string} Unique message ID
 */
export const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get message status icon
 * @param {string} status - Message status (sent, delivered, read, failed)
 * @returns {string} Status icon name
 */
export const getMessageStatusIcon = (status) => {
  switch (status) {
    case 'sending':
      return 'clock';
    case 'sent':
      return 'check';
    case 'delivered':
      return 'check-double';
    case 'read':
      return 'check-double';
    case 'failed':
      return 'alert-circle';
    default:
      return 'check';
  }
};

/**
 * Get message status text
 * @param {string} status - Message status
 * @returns {string} Status text
 */
export const getMessageStatusText = (status) => {
  switch (status) {
    case 'sending':
      return 'Sending...';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    case 'failed':
      return 'Failed to send';
    default:
      return '';
  }
};

/**
 * Search messages by keyword
 * @param {Array} messages - Array of messages
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered messages
 */
export const searchMessages = (messages, keyword) => {
  if (!keyword || !keyword.trim()) return messages;
  
  const searchTerm = keyword.toLowerCase().trim();
  
  return messages.filter(message => 
    message.content?.toLowerCase().includes(searchTerm) ||
    message.senderName?.toLowerCase().includes(searchTerm)
  );
};

/**
 * Count unread messages
 * @param {Array} messages - Array of messages
 * @param {string} userId - Current user ID
 * @returns {number} Count of unread messages
 */
export const countUnreadMessages = (messages, userId) => {
  if (!messages || !userId) return 0;
  
  return messages.filter(message => 
    message.senderId !== userId && 
    !message.isRead
  ).length;
};

/**
 * Mark messages as read
 * @param {Array} messages - Array of messages
 * @param {string} userId - Current user ID
 * @returns {Array} Updated messages
 */
export const markMessagesAsRead = (messages, userId) => {
  if (!messages || !userId) return messages;
  
  return messages.map(message => {
    if (message.senderId !== userId && !message.isRead) {
      return { ...message, isRead: true, readAt: new Date().toISOString() };
    }
    return message;
  });
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if message contains emoji only
 * @param {string} message - Message content
 * @returns {boolean} True if message contains only emojis
 */
export const isEmojiOnly = (message) => {
  if (!message) return false;
  
  const emojiRegex = /^[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
  return emojiRegex.test(message.trim());
};

/**
 * Get typing indicator text
 * @param {Array} typingUsers - Array of typing users
 * @returns {string} Typing indicator text
 */
export const getTypingText = (typingUsers) => {
  if (!typingUsers || typingUsers.length === 0) return '';
  
  if (typingUsers.length === 1) {
    return `${typingUsers[0]} is typing...`;
  } else if (typingUsers.length === 2) {
    return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  } else {
    return `${typingUsers.length} people are typing...`;
  }
};

/**
 * Debounce function for search/typing
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Escape special characters for regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export const escapeRegExp = (string) => {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default {
  formatMessageTime,
  formatMessageDate,
  groupMessagesByDate,
  isSameUser,
  isCloseTime,
  shouldShowAvatar,
  shouldShowTimestamp,
  truncateText,
  validateMessage,
  sanitizeMessage,
  extractMentions,
  highlightMentions,
  generateMessageId,
  getMessageStatusIcon,
  getMessageStatusText,
  searchMessages,
  countUnreadMessages,
  markMessagesAsRead,
  formatFileSize,
  isEmojiOnly,
  getTypingText,
  debounce,
  escapeRegExp
};