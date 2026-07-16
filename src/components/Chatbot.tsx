"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  showWhatsApp?: boolean;
};

const WHATSAPP_NUMBER = "263772957823";

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: id(),
      role: "bot",
      text: "Hello! Welcome to Postcorp Glass & Aluminium. Ask me about our services, products, projects, branches, quotations or contact details.",
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.toggle("postcorp-chat-open", open);
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
    return () => document.body.classList.remove("postcorp-chat-open");
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, open]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = text.trim();
    if (!question || sending) return;

    setMessages((current) => [
      ...current,
      { id: id(), role: "user", text: question },
    ]);
    setText("");
    setSending(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      const raw = await response.text();
      let data: { answer?: string; fallback?: boolean; error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
      }

      if (!response.ok) throw new Error(data.error || "Chatbot request failed");

      setMessages((current) => [
        ...current,
        {
          id: id(),
          role: "bot",
          text:
            data.answer ||
            "I do not have a confirmed answer. Please contact Postcorp on WhatsApp.",
          showWhatsApp: Boolean(data.fallback),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: id(),
          role: "bot",
          text: "I am unable to answer that right now. Please contact Postcorp on WhatsApp for assistance.",
          showWhatsApp: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Postcorp Glass & Aluminium. I need assistance."
  )}`;

  return (
    <div className="postcorp-chatbot-root">
      {open && (
        <section className="postcorp-chat-window" aria-label="Postcorp chatbot">
          <header className="postcorp-chat-header">
            <div className="postcorp-chat-identity">
              <span className="postcorp-chat-avatar">
                <MessageCircle size={21} />
              </span>
              <div>
                <strong>Postcorp Assistant</strong>
                <small><i /> Online support</small>
              </div>
            </div>
            <button
              type="button"
              className="postcorp-chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={21} />
            </button>
          </header>

          <div className="postcorp-chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`postcorp-chat-row ${message.role}`}>
                <div className={`postcorp-chat-bubble ${message.role}`}>
                  <p>{message.text}</p>
                  {message.showWhatsApp && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      Continue on WhatsApp <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="postcorp-chat-row bot">
                <div className="postcorp-chat-bubble bot postcorp-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="postcorp-chat-quick-actions">
            <button type="button" onClick={() => setText("What services do you provide?")}>Services</button>
            <button type="button" onClick={() => setText("How do I request a quotation?")}>Get a Quote</button>
            <button type="button" onClick={() => setText("Where are your branches?")}>Branches</button>
          </div>

          <form className="postcorp-chat-input" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your question here..."
              aria-label="Type your question"
              autoComplete="off"
            />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Send message">
              <Send size={19} />
            </button>
          </form>

          <a className="postcorp-chat-whatsapp-footer" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp: +263 77 295 7823
          </a>
        </section>
      )}

      <button
        type="button"
        className={`postcorp-chat-launcher ${open ? "open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        {open ? <X size={27} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
