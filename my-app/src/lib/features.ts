import type { Feature } from '@/components/FeatureGallery';

/**
 * Three screens per product, captured from the running apps. Each has a flat
 * capture and, where it holds up offline, an HTML snapshot the gallery
 * renders live with the named element ringed.
 */
export const featureGalleries: Record<number, { heading: string; eyebrow?: string; features: Feature[] }> = {
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
  13: {
    heading: 'Gallery',
    eyebrow: '',
    features: [
      {
        eyebrow: 'Scale',
        title: "Expansive maps",
        description:
          "The largest battle map: a 184 m mountain in the middle, rivers and roads winding round it, five gold mines and the sea on every side. Every block of it can be fought over.",
        image: '/products/sovereign-realms/island-mountain.jpg',
        alt: "Sovereign Realms: the Realm v2 island, with its mountain at the centre",
      },
      {
        eyebrow: 'Open world',
        title: "A world to cross, not just a board",
        description:
          "Forests, ridges, rivers and coastline between the two kingdoms. Armies march by road, cut through the woods or sail around the coast, and every part of the land can matter in a fight.",
        image: '/products/sovereign-realms/forest-canopy.jpg',
        alt: "Sovereign Realms: a world to cross, not just a board",
      },
      {
        eyebrow: 'Kingdom',
        title: "Build your own village",
        description:
          "Lay out farms, houses, mines, barracks and watch towers, then upgrade the castle to unlock more. This kingdom is built all the way up.",
        image: '/products/sovereign-realms/kingdom-full.jpg',
        alt: "Sovereign Realms: build your own village",
      },
      {
        eyebrow: 'Heroes',
        title: "Lead with a hero",
        description:
          "King David and Jonathan, the archer prince, are heroes you can play. They fight on the front line, lead their own guard and rise again at the castle after they fall.",
        image: '/products/sovereign-realms/king-david-castle.jpg',
        alt: "Sovereign Realms: lead with a hero",
      },
      {
        eyebrow: 'Battle',
        title: "Troops battle in real time",
        description:
          "Swordsmen and archers clash in formation, with every arrow in flight and every hit landing in the same simulation the player commands.",
        image: '/products/sovereign-realms/battle-clash.jpg',
        alt: "Sovereign Realms: troops battle in real time",
      },
      {
        eyebrow: 'Multi-terrain battle',
        title: "Fight on land and sea",
        description:
          "Load troops onto the troop ship, sail them around the coast and land them behind the enemy's lines.",
        image: '/products/sovereign-realms/troop-ship-sailing.jpg',
        alt: "Sovereign Realms: fight on land and sea",
      },
      {
        eyebrow: 'Construction',
        title: "Place it, then build it",
        description:
          "Choose a building, set it on the ground and Builders walk over and raise it piece by piece, with its progress shown over the site.",
        image: '/products/sovereign-realms/ui-place-farm.jpg',
        alt: "Sovereign Realms: place it, then build it",
      },
      {
        eyebrow: 'FPV',
        title: "First-person view and player control",
        description:
          "Take direct control of a hero or any soldier and fight from the ground, while still giving orders to the rest of the army.",
        image: '/products/sovereign-realms/ui-hero-king-david.jpg',
        alt: "Sovereign Realms: first-person view and player control",
      },
      {
        eyebrow: 'Fog of war',
        title: "See only what your troops see",
        description:
          "The enemy stays hidden until your units get close. Here 123 troops push across the basin into the unknown.",
        image: '/products/sovereign-realms/ui-overview-army-orders.jpg',
        alt: "Sovereign Realms: see only what your troops see",
      },
    ],
  },
};
