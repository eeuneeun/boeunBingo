"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { useGame } from "@/store/gameStore";

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

const formatTime = (at: number) =>
  new Date(at).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

export default function ChatBox() {
  const myId = useGame((s) => s.myId); // 내 메시지 구분용 (아래 참고)
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (m: ChatMsg) =>
      setMessages((prev) => [...prev.slice(-99), m]);
    socket.on("chat:message", onMsg);
    return () => {
      socket.off("chat:message", onMsg);
    };
  }, []);

  // 페이지 전체가 아니라 채팅 목록만 맨 아래로 스크롤
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        fontSize: 13,
      }}
    >
      {/* 대화 영역 */}
      <div
        ref={listRef}
        style={{
          height: 320,
          overflowY: "auto",
          background: "#b2c7d9",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {messages.map((m, i) => {
          if (m.type === "system") {
            return (
              <div key={m.id} style={{ textAlign: "center", margin: "8px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(0,0,0,0.22)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {m.message}
                </span>
              </div>
            );
          }

          const mine = m.userId === myId;
          const prev = messages[i - 1];
          // 같은 사람이 연속으로 보낸 경우 닉네임 생략
          const showName =
            !mine &&
            !(prev && prev.type === "user" && prev.userId === m.userId);

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: mine ? "flex-end" : "flex-start",
                marginTop: showName ? 6 : 0,
              }}
            >
              {showName && (
                <span
                  style={{ fontSize: 11, color: "#444", margin: "0 4px 3px" }}
                >
                  {m.nickname}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: mine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 5,
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    background: mine ? "#fee500" : "#fff",
                    color: "#191919",
                    padding: "7px 10px",
                    borderRadius: 12,
                    borderTopRightRadius: mine && showName !== false ? 4 : 12,
                    borderTopLeftRadius: !mine && showName ? 4 : 12,
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.message}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "#555",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {formatTime(m.at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력 영역 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 8,
          background: "#fff",
          borderTop: "1px solid #e5e5e5",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // 한글 입력 중 Enter가 두 번 전송되는 것을 방지
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          maxLength={200}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 18,
            border: "1px solid #e5e5e5",
            background: "#f5f5f5",
            outline: "none",
            fontSize: 13,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            padding: "8px 14px",
            borderRadius: 18,
            border: "none",
            background: input.trim() ? "#fee500" : "#f0f0f0",
            color: input.trim() ? "#191919" : "#aaa",
            fontWeight: 600,
            cursor: input.trim() ? "pointer" : "default",
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
