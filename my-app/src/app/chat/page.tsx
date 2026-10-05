import { Suspense } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

export const metadata = {
  title: 'Chat | Kyle-Anthony Hay',
  description: "Ask an AI agent about Kyle-Anthony Hay's projects, skills, and experience",
};

export default function ChatPage() {
  return (
    <main className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f9fafb]">
      <Suspense>
        <ChatInterface />
      </Suspense>
    </main>
  );
}
