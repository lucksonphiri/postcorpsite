"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  showWhatsApp?: boolean;
};

const WHATSAPP_NUMBER = "263772957823";


function WhatsAppIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.43 14.91L2 22l5.23-1.57A9.94 9.94 0 1 0 12.04 2Zm0 17.9a8 8 0 0 1-4.08-1.12l-.29-.17-3.1.93.96-3.02-.19-.31a7.95 7.95 0 1 1 6.7 3.69Zm4.38-5.96c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.2-1.42-1.34-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Chatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "bot",
      text: "Bring your vision to life with premium glass, aluminium and shopfitting solutions. Tell me what you are planning, and I’ll help you find the right solution or request a quotation.",
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const closeForMenu = () => setOpen(false);
    window.addEventListener("postcorp:mobile-menu-open", closeForMenu);
    return () => window.removeEventListener("postcorp:mobile-menu-open", closeForMenu);
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending, open]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = text.trim();
    if (!question || sending) return;

    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", text: question },
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
          id: createId(),
          role: "bot",
          text: data.answer || "I do not have a confirmed answer. Please contact Postcorp on WhatsApp.",
          showWhatsApp: Boolean(data.fallback),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "bot",
          text: "I am unable to answer that right now. Please contact Postcorp on WhatsApp for assistance.",
          showWhatsApp: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function openChat() {
    if (window.matchMedia("(max-width: 768px)").matches) {
      router.push("/chat");
      return;
    }
    setOpen((current) => !current);
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Postcorp Glass & Aluminium. I need assistance."
  )}`;

  if (!mounted || pathname === "/chat") return null;

  return createPortal(
    <div className="postcorp-chatbot-root desktop-chatbot-only">
      {open && (
        <section className="postcorp-chat-window" aria-label="Postcorp chatbot">
          <header className="postcorp-chat-header">
            <div className="postcorp-chat-identity">
              <span className="postcorp-chat-avatar"><MessageCircle size={21} /></span>
              <div>
                <strong>Postcorp Assistant</strong>
                <small><i /> Online support</small>
              </div>
            </div>
            <button type="button" className="postcorp-chat-close" onClick={() => setOpen(false)} aria-label="Close chatbot">
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
                <div className="postcorp-chat-bubble bot postcorp-chat-typing"><span /><span /><span /></div>
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
            <input ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your question here..." aria-label="Type your question" autoComplete="off" />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Send message"><Send size={19} /></button>
          </form>

          <a className="postcorp-chat-whatsapp-footer" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={19} /> <span>+263 77 295 7823</span>
          </a>
        </section>
      )}

      <button type="button" className={`postcorp-chat-launcher ${open ? "open" : ""}`} onClick={openChat} aria-label={open ? "Close chatbot" : "Open chatbot"}>
        {open ? <X size={27} /> : <MessageCircle size={28} />}
      </button>
    </div>,
    document.body
  );
}
