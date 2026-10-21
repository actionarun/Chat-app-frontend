import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import api, { API_URL } from "../api";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null); setUser(null); setOnlineUsers([]);
  };

  // restore session from saved token
  useEffect(() => {
    if (!token) return setLoading(false);
    api.get("/auth/me").then((r) => setUser(r.data.user)).catch(logout).finally(() => setLoading(false));
  }, [token]);

  // socket connection
  useEffect(() => {
    if (!token || !user) return;
    const s = io(API_URL, { auth: { token } });
    s.on("connect", () => console.log("Connected to server"));
    s.on("online-users", setOnlineUsers);
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
  }, [token, user?._id]);

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    setToken(token); setUser(user);
  };

  return <Ctx.Provider value={{ user, token, loading, socket, onlineUsers, login, logout }}>{children}</Ctx.Provider>;
}
