"use client";

import { useMemo, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
};

type AIChatPanelProps = {
  title: string;
};

export default function AIChatPanel({ title }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hello. I am your project assistant. Ask me about priorities, blockers, or timeline suggestions.",
    },
  ]);
  const [input, setInput] = useState("");

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "ai",
      text: "Dummy AI response: thanks for your message. AI backend integration can be plugged in here next.",
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="ui-page-title">{title}</h1>
        <p className="ui-body-muted">
          Chat with AI to discuss project execution and updates.
        </p>
      </div>

      <Card
        padding="none"
        className="h-[calc(100vh-14rem)] !flex-col !items-stretch !justify-start overflow-hidden"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-cs-primary-200 text-white"
                  : "bg-gray-100 text-cs-text"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-white px-4 py-3">
          <Input
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button type="button" onClick={handleSend} disabled={!canSend}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
