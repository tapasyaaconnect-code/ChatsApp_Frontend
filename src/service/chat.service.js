import api from "../api/axios";

const getConnections = async () => {
  const response = await api.get("/chat/connections");
  return response.data.connections;
};

const getMessages = async (userId) => {
  const response = await api.get(`/chat/messages/${userId}`);
  return response.data.messages;
};

const getUnreadCounts = async () => {
  const response = await api.get("/chat/unread");
  return response.data.unreadCounts;
};

const markMessagesRead = async (userId) => {
  await api.patch(`/chat/messages/${userId}/read`);
};

export default { getConnections, getMessages, getUnreadCounts, markMessagesRead };
