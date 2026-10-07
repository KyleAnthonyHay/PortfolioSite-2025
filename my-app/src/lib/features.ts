import type { Feature } from '@/components/FeatureGallery';

/**
 * Three screens per product, captured from the running apps. Each has a flat
 * capture and, where it holds up offline, an HTML snapshot the gallery
 * renders live with the named element ringed.
 */
export const featureGalleries: Record<number, { heading: string; features: Feature[] }> = {
  5: {
    heading: 'Contracts, read and remembered for you.',
    features: [
      {
        eyebrow: 'Overview',
        title: 'See what needs attention the moment you sign in',
        description:
          'The overview counts what’s expiring soon and what’s waiting on review, and turns each count into a shortcut. Ask a question about every contract from the same box.',
        image: '/products/ontract/feature-1.png',
        html: '/products/ontract/feature-1.html',
        highlight: '[data-gallery-highlight]',
        alt: 'The OnTract overview with the expiring-soon and awaiting-review counts',
      },
      {
        eyebrow: 'AI extraction',
        title: 'Upload a PDF, get the terms that matter',
        description:
          'OnTract reads each contract as it’s uploaded and pulls out the counterparty, dates, renewal type and payment terms. They show up beside the original document so anyone can check them against the source.',
        image: '/products/ontract/feature-2.png',
        html: '/products/ontract/feature-2.html',
        highlight: '[data-gallery-highlight]',
        alt: 'A lease PDF beside the terms the AI extracted from it',
      },
      {
        eyebrow: 'Ask AI',
        title: 'Ask a contract a question, get the clause back',
        description:
          'Every contract has its own assistant that answers from the document’s text and quotes the clause it relied on. Here it finds the Harborview renewal deadline and cites the notice requirement word for word.',
        image: '/products/ontract/feature-3.png',
        html: '/products/ontract/feature-3.html',
        highlight: '[data-gallery-highlight]',
        alt: 'The contract assistant answering with a quoted clause',
      },
    ],
  },
  6: {
    heading: 'Fifty thousand reviews, one clear picture.',
    features: [
      {
        eyebrow: 'Analytics',
        title: 'See how ratings move, and why',
        description:
          'Sentio+ turns 50,000 Google Play reviews into a dashboard of review volume, the rating breakdown, the sentiment split and average rating over time. Low-star reviews are grouped into complaint themes, so the biggest problem is the first thing you see.',
        image: '/products/sentio/feature-1.png',
        html: '/products/sentio/feature-1.html',
        highlight: '[data-gallery-highlight]',
        alt: 'The Sentio+ analytics dashboard with top complaint themes',
      },
      {
        eyebrow: 'Ask Sentio+',
        title: 'Ask your reviews a question in plain English',
        description:
          'A LangGraph agent searches the review collection with its own tools and answers with real counts and a quoted review. It also says what to fix first, and it remembers the conversation for follow-ups.',
        image: '/products/sentio/feature-2.png',
        html: '/products/sentio/feature-2.html',
        highlight: '[data-gallery-highlight]',
        alt: 'Sentio+ answering a question about Google Wallet reviews',
      },
      {
        eyebrow: 'Live view',
        title: 'Your customers and reviews on one globe',
        description:
          'Upload a customer CSV and every row lands on an interactive globe beside the reviews mapped by country. The side panel shows where customers are and how each region rates the app.',
        image: '/products/sentio/feature-3.png',
        alt: 'The live view globe with customers and reviews plotted by country',
      },
    ],
  },
  11: {
    heading: 'Built for the booth, from Sunday to Sunday.',
    features: [
      {
        eyebrow: 'Ask the booth',
        title: 'Sunday-morning answers from your own wiring',
        description:
          'A volunteer describes the problem in plain words and ProdBot matches it to a known pitfall, then walks the signal chain from the source. The answer names the real devices, channels and outputs on that campus.',
        image: '/products/prodbot/feature-1.png',
        html: '/products/prodbot/feature-1.html',
        highlight: '[data-gallery-highlight]',
        alt: 'ProdBot answering a volunteer with its reasoning trace expanded',
      },
      {
        eyebrow: 'Explore the wiring',
        title: 'Every cable on campus, on one map',
        description:
          'The whole campus is drawn as a live graph grouped by system, from stage mics to the PA and in-ears. Hover any device to see its model, location, connections and the pitfalls tied to it.',
        image: '/products/prodbot/feature-2.png',
        html: '/products/prodbot/feature-2.html',
        highlight: '[data-gallery-highlight]',
        alt: 'The campus wiring diagram with a device card open',
      },
      {
        eyebrow: 'Keep it current',
        title: 'Fixes from Sunday become documentation by Monday',
        description:
          'When a volunteer reports a fix in chat, ProdBot drafts it as an update to the matching pitfall An admin approves or rejects it in one click, so the next person gets the answer.',
        image: '/products/prodbot/feature-3.png',
        html: '/products/prodbot/feature-3.html',
        highlight: '[data-gallery-highlight]',
        alt: 'The documentation review queue with a drafted update awaiting approval',
      },
    ],
  },
};
