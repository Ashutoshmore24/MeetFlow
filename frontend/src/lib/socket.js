import { io } from "socket.io-client";

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const socket = io(baseURL, {
  withCredentials: true,
  autoConnect: false,
});