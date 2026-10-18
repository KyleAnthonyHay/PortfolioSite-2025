import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

// One blue control with two ways in: type to the agent, or call it. Shared by
// the hero and the floating bar so the two stay identical.
const AgentPill = () => (
  <div className="inline-flex h-[52px] items-stretch overflow-hidden rounded-xl bg-accent-blue text-white shadow-[0_10px_28px_-8px_rgba(10,132,255,0.6)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-8px_rgba(10,132,255,0.7)]">
    <Link
      href="/chat"
      className="group inline-flex items-center gap-2.5 whitespace-nowrap pl-4 pr-5 text-[15px] font-medium hover:bg-[#0077e6] active:scale-[0.98] transition-all duration-200"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
        {/* Eager: the floating copy starts hidden off-screen, where a lazy image never loads. */}
        <Image src="/agent.png" alt="" width={26} height={26} loading="eager" className="h-[26px] w-[26px] object-contain" />
        <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-accent-blue" />
      </span>
      Talk to my AI Agent
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
    <Link
      href="/chat?call=1"
      aria-label="Call my AI Agent"
      title="Call my AI Agent"
      className="inline-flex items-center gap-1.5 border-l border-white/25 px-4 text-[14px] font-medium hover:bg-[#0077e6] active:scale-[0.98] transition-all duration-200"
    >
      <Phone aria-hidden="true" className="h-4 w-4" />
      <span className="max-sm:hidden">Call</span>
    </Link>
  </div>
);

export default AgentPill;
