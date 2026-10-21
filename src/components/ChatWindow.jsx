import { useEffect, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatWindow({ peer, onBack }) {
  const { user, socket, onlineUsers } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottom = useRef();
  const online = onlineUsers.includes(peer._id);

  // load chat history from DB
  useEffect(() => {
    api.get(`/messages/${peer._id}`).then((r) => setMessages(r.data)).catch(() => {});
  }, [peer._id]);

  // receive messages in real time
  useEffect(() => {
    if (!socket) return;
    const onMsg = (m) => {
      const mine = m.senderId === user._id && m.receiverId === peer._id;
      const theirs = m.senderId === peer._id && m.receiverId === user._id;
      if (mine || theirs) setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
    };
    socket.on("receive-message", onMsg);
    return () => socket.off("receive-message", onMsg);
  }, [socket, peer._id, user._id]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit("send-message", { receiverId: peer._id, message: text }, (saved) => {
      setMessages((prev) => (prev.some((x) => x._id === saved._id) ? prev : [...prev, saved]));
    });
    setText("");
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <button onClick={onBack} className="md:hidden text-xl" aria-label="Back">←</button>
        <Avatar name={peer.name} />
        <div>
          <p className="font-semibold leading-tight">{peer.name}</p>
          <p className={`text-xs ${online ? "text-green-500" : "text-slate-400"}`}>{online ? "Online" : "Offline"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 && <p className="text-center text-sm text-slate-400 mt-10">No messages yet. Say hi to {peer.name}!</p>}
        {messages.map((m) => {
          const mine = m.senderId === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 rounded-bl-sm shadow-sm"}`}>
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 text-right ${mine ? "text-blue-100" : "text-slate-400"}`}>{time(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
          className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white grid place-items-center" aria-label="Send">➤</button>
      </form>
    </div>
  );
}
