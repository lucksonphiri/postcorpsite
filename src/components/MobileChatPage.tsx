"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Home, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  showWhatsApp?: boolean;
};

const WHATSAPP_NUMBER = "263772957823";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function MobileChatPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "bot",
      text: "Hello! Welcome to Postcorp Glass & Aluminium. Ask me about our services, products, projects, branches, quotations or contact details.",
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  function exitChat() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = text.trim();
    if (!question || sending) return;

    setMessages((current) => [...current, { id: createId(), role: "user", text: question }]);
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
        try { data = JSON.parse(raw); } catch { data = {}; }
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

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Postcorp Glass & Aluminium. I need assistance.")}`;

  return (
    <main className="mobile-chat-page">
      <header className="mobile-chat-page-header">
        <button type="button" onClick={exitChat} aria-label="Go back"><ArrowLeft size={23} /></button>
        <div className="mobile-chat-page-title">
          <span><MessageCircle size={20} /></span>
          <div><strong>Postcorp Assistant</strong><small><i /> Online support</small></div>
        </div>
        <button type="button" onClick={exitChat} aria-label="Close chat"><X size={23} /></button>
      </header>

      <section className="mobile-chat-page-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`mobile-chat-page-row ${message.role}`}>
            <div className={`mobile-chat-page-bubble ${message.role}`}>
              <p>{message.text}</p>
              {message.showWhatsApp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Continue on WhatsApp <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="mobile-chat-page-row bot">
            <div className="mobile-chat-page-bubble bot mobile-chat-page-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <div className="mobile-chat-page-actions">
        <button type="button" onClick={() => setText("What services do you provide?")}>Services</button>
        <button type="button" onClick={() => setText("How do I request a quotation?")}>Get a Quote</button>
        <button type="button" onClick={() => setText("Where are your branches?")}>Branches</button>
      </div>

      <form className="mobile-chat-page-form" onSubmit={sendMessage}>
        <input ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your question here..." aria-label="Type your question" autoComplete="off" />
        <button type="submit" disabled={sending || !text.trim()} aria-label="Send message"><Send size={20} /></button>
      </form>

      <footer className="mobile-chat-page-footer">
        <Link href="/"><Home size={15} /> Return to website</Link>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp support</a>
      </footer>
    </main>
  );
}
