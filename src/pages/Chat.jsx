import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="h-full flex bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 border-r border-slate-200 dark:border-slate-700`}>
        <Sidebar selected={selected} onSelect={setSelected} />
      </div>
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
        {selected
          ? <ChatWindow key={selected._id} peer={selected} onBack={() => setSelected(null)} />
          : <div className="flex-1 grid place-items-center text-slate-400">Select a user to start chatting</div>}
      </div>
    </div>
  );
}
