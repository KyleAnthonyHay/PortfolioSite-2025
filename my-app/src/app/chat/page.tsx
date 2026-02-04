import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

export const metadata = {
  title: 'Chat | Kyle-Anthony Hay',
  description: 'Chat with an AI assistant about Kyle-Anthony Hay\'s projects and experience',
};

export default function ChatPage() {
  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ChatInterface />
      </div>
      <Header />
    </main>
  );
}
