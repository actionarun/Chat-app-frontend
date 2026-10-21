import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Auth() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [signup, setSignup] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      if (step === "otp") {
        const { data } = await api.post("/auth/verify", { email: form.email, otp });
        login(data);
        return;
      }
      const { data } = await api.post(signup ? "/auth/signup" : "/auth/login", form);
      if (data.needsVerify) { setStep("otp"); setInfo(`We sent a 6-digit code to ${data.email}.`); }
      else login(data);
    } catch (err) {
      const d = err.response?.data;
      if (d?.needsVerify) { setStep("otp"); setInfo(d.error); }
      else setError(d?.error || "Cannot reach the server. Check that the backend is running.");
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setError(""); setInfo("");
    try {
      await api.post("/auth/resend", { email: form.email });
      setInfo("New code sent. Check your inbox and spam folder.");
    } catch (err) { setError(err.response?.data?.error || "Could not resend the code."); }
  };

  const input = "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="h-full grid place-items-center bg-slate-100 dark:bg-slate-900 p-4">
      <button onClick={toggle} className="absolute top-4 right-4 text-xl" aria-label="Toggle theme">{dark ? "☀️" : "🌙"}</button>
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-blue-600">ChatApp</h1>

        {step === "form" ? (
          <>
            <p className="text-slate-500 dark:text-slate-300 text-sm">{signup ? "Create your account to start chatting." : "Log in to continue your chats."}</p>
            {signup && <input className={input} placeholder="Name" autoComplete="name" value={form.name} onChange={set("name")} required />}
            <input className={input} type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={set("email")} required />
            <input className={input} type="password" placeholder="Password (6+ characters)" autoComplete={signup ? "new-password" : "current-password"} value={form.password} onChange={set("password")} required />
          </>
        ) : (
          <>
            <p className="font-medium dark:text-white">Verify your email</p>
            {info && <p className="text-sm text-slate-500 dark:text-slate-300">{info}</p>}
            <input className={`${input} text-center text-xl tracking-[0.5em]`} inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {step === "form" && info && <p className="text-sm text-green-600">{info}</p>}

        <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5">
          {busy ? "Please wait…" : step === "otp" ? "Verify email" : signup ? "Sign up" : "Log in"}
        </button>

        {step === "otp" ? (
          <div className="flex justify-between text-sm text-blue-600">
            <button type="button" onClick={resend}>Resend code</button>
            <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); setInfo(""); }}>Back</button>
          </div>
        ) : (
          <button type="button" onClick={() => { setSignup(!signup); setError(""); setInfo(""); }} className="w-full text-sm text-blue-600">
            {signup ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        )}
      </form>
    </div>
  );
}