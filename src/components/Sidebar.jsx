import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";

export default function Sidebar({ selected, onSelect }) {
  const { user, onlineUsers, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  // search users (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      api.get("/users", { params: { q } }).then((r) => setUsers(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const isOnline = (id) => onlineUsers.includes(id);
  const sorted = [...users].sort((a, b) => isOnline(b._id) - isOnline(a._id)); // online first

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-blue-600">ChatApp</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggle} aria-label="Toggle theme">{dark ? "☀️" : "🌙"}</button>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500">Log out</button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…"
          className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && <p className="p-4 text-sm text-slate-400">{q ? "No users match your search." : "No other users yet. Sign up a second account to chat."}</p>}
        {sorted.map((u) => (
          <button key={u._id} onClick={() => onSelect(u)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${selected?._id === u._id ? "bg-blue-50 dark:bg-slate-800" : ""}`}>
            <Avatar name={u.name} online={isOnline(u._id)} />
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name}</p>
              <p className={`text-xs ${isOnline(u._id) ? "text-green-500" : "text-slate-400"}`}>{isOnline(u._id) ? "Online" : "Offline"}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 truncate">Signed in as {user.name}</div>
    </div>
  );
}
