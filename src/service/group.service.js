import api from "../api/axios";

const list = async () => (await api.get("/groups")).data.groups;
const create = async (data) => (await api.post("/groups", data)).data.group;
const addMembers = async (groupId, memberIds) =>
  (await api.post(`/groups/${groupId}/members`, { memberIds })).data.group;
const leave = async (groupId) => api.delete(`/groups/${groupId}/members/me`);
const messages = async (groupId) => (await api.get(`/groups/${groupId}/messages`)).data.messages;

export default { list, create, addMembers, leave, messages };
