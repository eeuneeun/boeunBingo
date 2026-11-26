"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

type ChatMsg =
  | {
      id: string;
      type: "user";
      userId: string;
      nickname: string;
      message: string;
      at: number;
    }
  | { id: string; type: "system"; message: string; at: number };

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
      <div
        style={{
          height: 200,
          overflowY: "auto",
          border: "1px solid #eaeaea",
          padding: 20,
          fontSize: 13,
        }}
      >
        {messages.map((m) =>
          m.type === "system" ? (
            <div
              key={m.id}
              style={{ textAlign: "center", color: "#888", fontSize: 12 }}
            >
              {m.message}
            </div>
          ) : (
            <div key={m.id}>
              <b>{m.nickname}</b>: {m.message}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        maxLength={200}
        style={{
          width: "calc(100% - 60px)",
          marginTop: 10,
          padding: 5,
          borderRadius: 0,
          border: "1px solid #eaeaea",
        }}
      />
      <button
        onClick={send}
        style={{
          width: 55,
          marginLeft: 5,
          padding: 5,
          backgroundColor: "#ff9900",
          border: "1px solid #ff9900",
          color: "white",
        }}
      >
        전송
      </button>
    </div>
  );
}
