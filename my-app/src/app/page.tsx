import TopHeader from '@/components/TopHeader';
import Hero from '@/components/Hero';
import Projects from '@/components/Projects';
import About from '@/components/About';
import WebResume from '@/components/WebResume';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[#f9fafb]">
      <TopHeader />
      <Hero />
      <Projects />
      <About />
      <WebResume />
      <Footer />
      <Header />
    </main>
  );
}
