"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

type ChatMsg = {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  at: number;
};

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (m: ChatMsg) =>
      setMessages((prev) => [...prev.slice(-99), m]);
    socket.on("chat:message", onMsg);
    return () => {
      socket.off("chat:message", onMsg);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit(
      "chat:send",
      { message: input },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) alert(res.error);
      },
    );
    setInput("");
  };

  return (
    <div>
      <div style={{ height: 200, overflowY: "auto" }}>
        {messages.map((m) => (
          <div key={m.id}>
            <b>{m.nickname}</b>: {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        maxLength={200}
      />
      <button onClick={send}>전송</button>
    </div>
  );
}
