import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Auth() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [signup, setSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const { data } = await api.post(signup ? "/auth/signup" : "/auth/login", form);
      login(data);
    } catch (err) {
      setError(err.response?.data?.error || "Cannot reach the server. Check that the backend is running.");
    } finally { setBusy(false); }
  };

  const input = "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="h-full grid place-items-center bg-slate-100 dark:bg-slate-900 p-4">
      <button onClick={toggle} className="absolute top-4 right-4 text-xl" aria-label="Toggle theme">{dark ? "☀️" : "🌙"}</button>
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-blue-600">ChatApp</h1>
        <p className="text-slate-500 dark:text-slate-300 text-sm">{signup ? "Create your account to start chatting." : "Log in to continue your chats."}</p>
        {signup && <input className={input} placeholder="Name" value={form.name} onChange={set("name")} required />}
        <input className={input} type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
        <input className={input} type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder="Password (6+ characters)" value={form.password} onChange={set("password")} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5">
          {busy ? "Please wait…" : signup ? "Sign up" : "Log in"}
        </button>
        <button type="button" onClick={() => { setSignup(!signup); setError(""); }} className="w-full text-sm text-blue-600">
          {signup ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}
