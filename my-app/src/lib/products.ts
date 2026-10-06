/**
 * The flagship products on the home page. Loops are muted cuts of each
 * explainer; tours are the full narrated explainers, played on demand.
 */
export interface Product {
  slug: string;
  /** Detail page on this site. */
  projectId: number;
  name: string;
  /** End-card line from the product's own explainer. */
  motto: string;
  kind: string;
  summary: string;
  builtFor: string;
  stack: string[];
  live: string;
  github?: string;
  loop: string;
  poster: string;
  tour: string;
  /** End card of the explainer, shown before it plays. */
  tourPoster: string;
  tourLength: string;
}

export const products: Product[] = [
  {
    slug: 'ontract',
    projectId: 5,
    name: 'OnTract',
    motto: 'Contracts, handled.',
    kind: 'Contract management',
    summary:
      'Every contract on one dashboard, the terms read for you, and answers that quote the clause they came from. Clients get their own portal to review and comment.',
    builtFor: 'Legal and operations teams',
    stack: ['Next.js', 'FastAPI', 'LangGraph', 'pgvector', 'AWS Bedrock'],
    live: 'https://ontract.kyleanthonyhay.com',
    loop: '/products/ontract/loop.mp4',
    poster: '/products/ontract/poster.jpg',
    tour: '/products/ontract/tour.mp4',
    tourPoster: '/products/ontract/tour-poster.jpg',
    tourLength: '0:47',
  },
  {
    slug: 'sentio',
    projectId: 6,
    name: 'Sentio+',
    motto: 'Hear every customer.',
    kind: 'App-review intelligence',
    summary:
      'Fifty thousand app reviews, and nobody on your team has read them all. Sentio+ has: ask it a question and it answers with the numbers and the reviews behind them.',
    builtFor: 'Product and support teams',
    stack: ['Next.js', 'Convex', 'LangGraph', 'OpenAI', 'ChromaDB'],
    live: 'https://sentio.kyleanthonyhay.com',
    github: 'https://github.com/KyleAnthonyHay/sentio',
    loop: '/products/sentio/loop.mp4',
    poster: '/products/sentio/poster.jpg',
    tour: '/products/sentio/tour.mp4',
    tourPoster: '/products/sentio/tour-poster.jpg',
    tourLength: '0:51',
  },
  {
    slug: 'prodbot',
    projectId: 11,
    name: 'V1 ProdBot',
    motto: 'See you Sunday.',
    kind: 'Production assistant',
    summary:
      'Something in the booth just went quiet. ProdBot walks a volunteer through their own church’s signal chain, closest to the problem first, and turns the fix into next week’s docs.',
    builtFor: 'V1 Church production volunteers',
    stack: ['React', 'Convex', 'OpenAI Responses API', 'React Flow'],
    live: 'https://prodbot.kyleanthonyhay.com',
    github: 'https://github.com/KyleAnthonyHay/V1Church-ProdBot',
    loop: '/products/prodbot/loop.mp4',
    poster: '/products/prodbot/poster.jpg',
    tour: '/products/prodbot/tour.mp4',
    tourPoster: '/products/prodbot/tour-poster.jpg',
    tourLength: '0:53',
  },
];

/** Smaller things that also shipped, listed below the flagships. */
export const alsoShipped = [
  { projectId: 1, name: 'SelahNote', kind: 'iOS app', note: 'AI sermon notes · 400+ users, 40 paying', image: '/demos/selahnote/onboarding-poster.jpg', href: 'https://selahnote.app' },
  { projectId: 10, name: 'SelahNote Creator Dashboard', kind: 'Internal tool', note: 'UGC referrals and monthly payouts', image: '/demos/selahnote-ugc/demo-poster.jpg' },
  { projectId: 9, name: 'SoundSnag', kind: 'macOS app', note: 'Audio saving and local file conversion', image: '/demos/soundsnag/demo-poster.jpg' },
  { projectId: 8, name: 'YarnScript', kind: 'Web app', note: 'A teleprompter that follows your voice', image: '/demos/yarnscript/demo-poster.jpg', href: 'https://yarn-script.vercel.app' },
];
