import type { Metadata } from "next";
import MobileChatPage from "@/components/MobileChatPage";

export const metadata: Metadata = {
  title: "Postcorp Assistant | Postcorp Glass & Aluminium",
  description: "Chat with Postcorp Glass & Aluminium support.",
};

export default function ChatPage() {
  return <MobileChatPage />;
}
