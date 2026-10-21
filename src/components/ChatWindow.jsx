import { useEffect, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// shrink photo to max 1280px JPEG so it uploads fast
const compress = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });

export default function ChatWindow({ peer, onBack }) {
  const { user, socket, onlineUsers } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [zoom, setZoom] = useState("");
  const [err, setErr] = useState("");
  const [menuId, setMenuId] = useState(null);   // which message's actions are open
  const [editing, setEditing] = useState(null); // message being edited
  const bottom = useRef();
  const fileRef = useRef();
  const online = onlineUsers.includes(peer._id);

  const replaceMsg = (u) => setMessages((prev) => prev.map((x) => (x._id === u._id ? u : x)));

  // load history
  useEffect(() => {
    api.get(`/messages/${peer._id}`).then((r) => setMessages(r.data)).catch(() => {});
  }, [peer._id]);

  // realtime: new, edited and deleted messages
  useEffect(() => {
    if (!socket) return;
    const onMsg = (m) => {
      const mine = m.senderId === user._id && m.receiverId === peer._id;
      const theirs = m.senderId === peer._id && m.receiverId === user._id;
      if (mine || theirs) setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
    };
    const onUpdate = (m) => setMessages((prev) => prev.map((x) => (x._id === m._id ? m : x)));
    socket.on("receive-message", onMsg);
    socket.on("message-updated", onUpdate);
    return () => { socket.off("receive-message", onMsg); socket.off("message-updated", onUpdate); };
  }, [socket, peer._id, user._id]);

  // scroll to bottom only when a new message is added (not on edit/delete)
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // close action menu when clicking anywhere else
  useEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const pickFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose an image file.");
    try { setImage(await compress(f)); setErr(""); }
    catch { setErr("Could not read this image."); }
  };

  const startEdit = (m) => {
    setEditing(m); setText(m.message); setImage(""); setErr(""); setMenuId(null);
  };
  const cancelEdit = () => { setEditing(null); setText(""); setErr(""); };

  const removeMsg = (m) => {
    setMenuId(null);
    if (!window.confirm("Delete this message for everyone?")) return;
    socket.emit("delete-message", { messageId: m._id }, (res) => {
      if (res?.error) return setErr(res.error);
      replaceMsg(res);
    });
  };

  const send = (e) => {
    e.preventDefault();
    if (!socket) return;

    if (editing) {
      if (!text.trim() && !editing.image) return setErr("Message can't be empty.");
      if (text.trim() === editing.message) return cancelEdit(); // nothing changed
      socket.emit("edit-message", { messageId: editing._id, message: text }, (res) => {
        if (res?.error) return setErr(res.error);
        replaceMsg(res);
      });
      setEditing(null); setText(""); setErr("");
      return;
    }

    if (!text.trim() && !image) return;
    socket.emit("send-message", { receiverId: peer._id, message: text, image }, (saved) => {
      if (saved?.error) return setErr(saved.error);
      setMessages((prev) => (prev.some((x) => x._id === saved._id) ? prev : [...prev, saved]));
    });
    setText(""); setImage(""); setErr("");
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
          const canAct = mine && !m.deleted;
          return (
            <div key={m._id} className={`flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
              {canAct && (
                menuId === m._id ? (
                  <div className="flex gap-1 text-xs shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => startEdit(m)} className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">✏️ Edit</button>
                    <button onClick={() => removeMsg(m)} className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200">🗑️ Delete</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setMenuId(m._id); }}
                    className="px-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" aria-label="Message options">⋮</button>
                )
              )}

              <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm break-words ${
                m.deleted
                  ? "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-400 italic"
                  : mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 rounded-bl-sm shadow-sm"}`}>
                {m.deleted ? (
                  <p>🚫 This message was deleted</p>
                ) : (
                  <>
                    {m.image && (
                      <img src={m.image} alt="Shared photo" onClick={() => setZoom(m.image)}
                        className="rounded-lg max-h-64 w-auto cursor-pointer mb-1" />
                    )}
                    {m.message && <p>{m.message}</p>}
                  </>
                )}
                <p className={`text-[10px] mt-1 text-right ${mine && !m.deleted ? "text-blue-100" : "text-slate-400"}`}>
                  {m.edited && !m.deleted && "edited · "}{time(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700">
        {err && <p className="px-3 pt-2 text-sm text-red-500">{err}</p>}
        {editing && (
          <div className="px-3 pt-3 flex items-center justify-between text-sm text-blue-600">
            <span>✏️ Editing message</span>
            <button type="button" onClick={cancelEdit} className="text-slate-500 hover:text-red-500">Cancel</button>
          </div>
        )}
        {image && !editing && (
          <div className="px-3 pt-3 flex items-start gap-2">
            <img src={image} alt="Selected photo" className="h-24 rounded-lg" />
            <button type="button" onClick={() => setImage("")} className="text-sm text-slate-500 hover:text-red-500">Remove</button>
          </div>
        )}
        <form onSubmit={send} className="flex items-center gap-2 p-3">
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
          {!editing && (
            <button type="button" onClick={() => fileRef.current.click()} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center" aria-label="Attach photo">📎</button>
          )}
          <input value={text} onChange={(e) => setText(e.target.value)}
            placeholder={editing ? "Edit your message…" : image ? "Add a caption…" : "Type a message…"}
            className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white grid place-items-center" aria-label={editing ? "Save edit" : "Send"}>{editing ? "✓" : "➤"}</button>
        </form>
      </div>

      {zoom && (
        <div onClick={() => setZoom("")} className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4">
          <img src={zoom} alt="Full size photo" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </div>
  );
}