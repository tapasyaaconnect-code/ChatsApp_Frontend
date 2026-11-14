import api from "../api/axios";

const getBlockedUsers = async () => (await api.get("/social/blocks")).data.blockedUserIds;
const block = async (userId) => api.post(`/social/blocks/${userId}`);
const unblock = async (userId) => api.delete(`/social/blocks/${userId}`);

export default { getBlockedUsers, block, unblock };
