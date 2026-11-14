import api from "../api/axios";

const sendOTP = async (email) => {
  const response = await api.post("/auth/send-otp", { email });

  return response.data;
};

const verifyOTP = async (data) => {
  const response = await api.post("/auth/verify-otp", data);

  return response.data;
};

const updateProfile = async (data) => {
  const response = await api.put("/auth/profile", data);

  return response.data;
};

const updateAvatar = async (file) => {
  const response = await api.putForm("/auth/profile/avatar", {
    avatar: file,
  });
  return response.data;
};

const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data.users;
};

export default {
  sendOTP,

  verifyOTP,

  updateProfile,

  updateAvatar,

  getUsers,
};
