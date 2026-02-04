import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

export const metadata = {
  title: 'Chat | Kyle-Anthony Hay',
  description: 'Chat with an AI assistant about Kyle-Anthony Hay\'s projects and experience',
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-6 px-4">
        <ChatInterface />
      </div>
      <Header />
    </main>
  );
}
