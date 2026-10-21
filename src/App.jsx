import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-full grid place-items-center dark:bg-slate-900 dark:text-white">Loading…</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
      <Route path="/" element={user ? <Chat /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
