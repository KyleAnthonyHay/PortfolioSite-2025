import { Suspense } from 'react';
import ChatInterface from '@/components/ChatInterface';

export const metadata = {
  title: 'Chat | Kyle-Anthony Hay',
  description: 'Chat with an AI assistant about Kyle-Anthony Hay\'s projects and experience',
};

export default function ChatPage() {
  return (
    <main className="h-[100dvh] bg-white flex flex-col overflow-hidden fixed inset-0">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Suspense>
          <ChatInterface />
        </Suspense>
      </div>
    </main>
  );
}
