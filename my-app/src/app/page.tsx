import TopHeader from '@/components/TopHeader';
import Hero from '@/components/Hero';
import Projects from '@/components/Projects';
import About from '@/components/About';
import WebResume from '@/components/WebResume';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Intro from '@/components/home/Intro';
import { IntroProvider } from '@/components/home/IntroContext';

export default function Home() {
  return (
    <IntroProvider>
      <main className="min-h-[100dvh] bg-paper">
        <Intro />
        <TopHeader />
        <Hero />
        <Projects />
        <About />
        <WebResume />
        <Footer />
        <Header />
      </main>
    </IntroProvider>
  );
}
