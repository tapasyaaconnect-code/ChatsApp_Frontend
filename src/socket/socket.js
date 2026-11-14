import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/socket";

export const createChatSocket = () =>
  io(SOCKET_URL, {
    auth: { token: localStorage.getItem("token") },
    autoConnect: true,
  });
