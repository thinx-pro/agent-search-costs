// Search / fetch API prices for AI agents.
// Every number below was read from the provider's own page on CHECKED.
// Anything we could not read there is left out or marked "not stated".
export const CHECKED = '2026-10-19';

// Pricing shapes:
//   perK:       { kind: 'perK', usdPerK }                     flat price per 1,000 requests
//   credits:    { kind: 'credits', ... }                      see calc.js
//   plans:      [{ name, usd, includes }]                     monthly plans; cheapest that fits is used
export const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek Search / Fetch',
    source: 'https://api-docs.deepseek.com/guides/search/',
    search: { kind: 'perK', usdPerK: 0.75 },
    fetch: { kind: 'perK', usdPerK: 0.75 },
    freeMonthly: null,
    billing: 'Only HTTP 200 responses with a result are billed; empty results, failures and timeouts are free.',
    limits: 'Search 100 QPS, Fetch 25 QPS + per-domain limit',
    retention: 'Not stated on the docs page.',
    zdr: false,
    promo: {
      until: '2026-11-01T00:00:00+08:00',
      text: 'Free when called through DeepSeek Harness, Claude Code or Codex until 00:00 Beijing time, 1 Nov 2026.',
    },
  },
  {
    id: 'brave',
    name: 'Brave Search API',
    source: 'https://brave.com/search/api/',
    search: { kind: 'perK', usdPerK: 5 },
    fetch: null,
    freeMonthly: { usd: 5 },
    billing: 'Search plan: $5 per 1,000 requests with $5 of free credit each month (the page banner also says "up to $20").',
    limits: '50 QPS on Search',
    retention: 'Zero Data Retention on Enterprise plans. Storing results or training on them needs a plan with storage rights.',
    zdr: 'enterprise',
  },
  {
    id: 'exa',
    name: 'Exa',
    source: 'https://exa.ai/pricing',
    search: { kind: 'perK', usdPerK: 4, includedResults: 10, extraResultUsdPerK: 1, variant: 'instant' },
    searchAlt: { label: 'fast / auto', usdPerK: 7 },
    fetch: { kind: 'perK', usdPerK: 1 },
    freeMonthly: { usd: 10 },
    billing: 'Search (instant) $4 / 1k with up to 10 results, each extra result $1 / 1k; fast/auto $7 / 1k. Contents $1 / 1k pages per content type.',
    limits: 'not checked',
    retention: 'Zero Data Retention on Enterprise (custom price).',
    zdr: 'enterprise',
  },
  {
    id: 'tavily',
    name: 'Tavily',
    source: 'https://docs.tavily.com/documentation/api-credits',
    search: { kind: 'credits', creditsPerRequest: 1 }, // basic; advanced = 2
    fetch: { kind: 'credits', creditsPerRequest: 1 / 5 }, // basic extract: 1 credit per 5 URLs
    credits: {
      paygUsd: 0.008,
      freeCredits: 1000,
      plans: [
        { name: 'Project', usd: 30, includes: 4000 },
        { name: 'Bootstrap', usd: 100, includes: 15000 },
        { name: 'Startup', usd: 220, includes: 38000 },
        { name: 'Growth', usd: 500, includes: 100000 },
      ],
    },
    billing: 'Basic search 1 credit, advanced 2. Basic extract 1 credit per 5 URLs. Pay-as-you-go $0.008 / credit; 1,000 free credits a month.',
    limits: 'not checked',
    retention: 'Not on the page we read.',
    zdr: null,
  },
  {
    id: 'serper',
    name: 'Serper (Google results)',
    source: 'https://serper.dev/',
    search: { kind: 'packs' },
    fetch: null,
    packs: [
      { name: 'Starter', usd: 50, credits: 50000 },
      { name: 'Standard', usd: 375, credits: 500000 },
      { name: 'Scale', usd: 1250, credits: 2500000 },
      { name: 'Ultimate', usd: 3750, credits: 12500000 },
    ],
    packMonths: 6,
    freeMonthly: null,
    billing: 'Prepaid credit packs, valid 6 months: $1.00 / 1k (50k) down to $0.30 / 1k (12.5M). 2,500 free queries once at sign-up.',
    limits: '50–300 QPS by pack',
    retention: 'Not on the page we read.',
    zdr: null,
  },
  {
    id: 'serpapi',
    name: 'SerpApi',
    source: 'https://serpapi.com/pricing',
    search: { kind: 'plans' },
    fetch: null,
    plans: [
      { name: 'Free', usd: 0, includes: 250 },
      { name: 'Starter', usd: 25, includes: 1000 },
      { name: 'Developer', usd: 75, includes: 5000 },
      { name: 'Production', usd: 150, includes: 15000 },
      { name: 'Big Data', usd: 275, includes: 30000 },
    ],
    billing: 'Monthly plans by searches per month ($25 for 1k … $275 for 30k). Larger volumes: enterprise quote.',
    limits: 'Hourly throughput cap per plan (50–6,000 searches/hour)',
    retention: 'Not on the page we read.',
    zdr: null,
  },
  {
    id: 'perplexity',
    name: 'Perplexity Search API',
    source: 'https://docs.perplexity.ai/getting-started/pricing',
    search: { kind: 'perK', usdPerK: 5 },
    searchAlt: { label: 'Fast Search', usdPerK: 1 },
    fetch: null,
    freeMonthly: null,
    billing: '$5 / 1k requests ($1 / 1k with Fast Search). One request can carry up to 5 queries. Failed and rate-limited requests are not billed.',
    limits: 'not checked',
    retention: 'Not on the pricing page.',
    zdr: null,
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    source: 'https://www.firecrawl.dev/pricing',
    search: { kind: 'credits', creditsPerRequest: 2, perResults: 10 }, // 2 credits per 10 results
    fetch: { kind: 'credits', creditsPerRequest: 1 }, // scrape: 1 credit / page
    credits: {
      paygUsd: null,
      freeCredits: 1000,
      plans: [
        { name: 'Hobby', usd: 16, includes: 5000 },
        { name: 'Standard', usd: 83, includes: 100000 },
        { name: 'Growth', usd: 333, includes: 500000 },
        { name: 'Scale', usd: 599, includes: 1000000 },
      ],
    },
    billing: 'Search 2 credits per 10 results; scrape 1 credit per page. Plan prices are per month billed yearly (Hobby is $19 billed monthly).',
    limits: '2–100 concurrent requests by plan',
    retention: 'Zero Data Retention on Enterprise only.',
    zdr: 'enterprise',
  },
];

// Looked at but left out of the calculator, and why.
export const LEFT_OUT = [
  { name: 'Jina Reader / Search', why: 'Billed in tokens; the page we read did not list the price per token package.' },
  { name: 'Kagi Search API', why: 'Not checked in this release.' },
  { name: 'Google Programmable Search / Vertex grounding', why: 'Not checked in this release.' },
];
