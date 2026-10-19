import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, CHECKED } from '../docs/prices.js';
import { monthlyCost, rank } from '../docs/calc.js';

const P = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));
const BEFORE_PROMO_END = new Date('2026-10-20T00:00:00Z');
const AFTER_PROMO_END = new Date('2026-11-02T00:00:00Z');

test('every provider has a source URL and a checked date', () => {
  assert.match(CHECKED, /^\d{4}-\d{2}-\d{2}$/);
  for (const p of PROVIDERS) assert.match(p.source, /^https:\/\//, p.id);
});

test('DeepSeek: $0.75/1k for search and fetch', () => {
  const r = monthlyCost(P.deepseek, { searches: 10000, fetches: 10000, now: AFTER_PROMO_END });
  assert.equal(r.usd, 15);
});

test('DeepSeek promo only applies before 1 Nov 2026 (Beijing) and only when asked', () => {
  const promo = monthlyCost(P.deepseek, { searches: 10000, promo: true, now: BEFORE_PROMO_END });
  assert.equal(promo.usd, 0);
  assert.match(promo.label, /then \$7\.50/);
  assert.equal(monthlyCost(P.deepseek, { searches: 10000, promo: true, now: AFTER_PROMO_END }).usd, 7.5);
  assert.equal(monthlyCost(P.deepseek, { searches: 10000, promo: true, now: new Date('2026-10-31T16:00:00Z') }).usd, 7.5); // = 00:00 Beijing
  assert.equal(monthlyCost(P.deepseek, { searches: 10000, promo: false, now: BEFORE_PROMO_END }).usd, 7.5);
});

test('Brave: $5/1k minus $5 monthly credit', () => {
  assert.equal(monthlyCost(P.brave, { searches: 1000 }).usd, 0);
  assert.equal(monthlyCost(P.brave, { searches: 10000 }).usd, 45);
  assert.equal(monthlyCost(P.brave, { searches: 10000, freeTier: false }).usd, 50);
  assert.equal(monthlyCost(P.brave, { searches: 100, fetches: 100 }).searchOnly, true);
});

test('Exa: extra results above 10 are billed, contents $1/1k', () => {
  assert.equal(monthlyCost(P.exa, { searches: 10000, freeTier: false }).usd, 40);
  assert.equal(monthlyCost(P.exa, { searches: 10000, results: 20, freeTier: false }).usd, 140);
  assert.equal(monthlyCost(P.exa, { searches: 10000, fetches: 10000 }).usd, 40); // 40 + 10 - 10 credit
});

test('Tavily: free tier, pay as you go, or the cheapest plan', () => {
  assert.equal(monthlyCost(P.tavily, { searches: 800 }).usd, 0);
  // 10k basic searches = 10k credits. PAYG: 9k * 0.008 = 72; Bootstrap 15k = 100 -> PAYG wins
  assert.equal(monthlyCost(P.tavily, { searches: 10000 }).usd, 72);
  // 100k credits: PAYG 99k*0.008 = 792; Growth = 500
  const r = monthlyCost(P.tavily, { searches: 100000 });
  assert.equal(r.usd, 500);
  assert.match(r.label, /Growth/);
  // advanced search doubles credits; extract 1 credit / 5 urls
  assert.equal(monthlyCost(P.tavily, { searches: 1000, advanced: true, freeTier: false }).usd, 16);
  assert.equal(monthlyCost(P.tavily, { fetches: 5000, freeTier: false }).usd, 8);
});

test('Serper: pack price, but a pack you cannot use within 6 months is partly wasted', () => {
  // 10k/month: starter $50 per 50k -> $10/month
  assert.equal(monthlyCost(P.serper, { searches: 10000 }).usd, 10);
  // 1k/month: starter lasts 50 months but expires after 6 -> $50/6
  assert.equal(monthlyCost(P.serper, { searches: 1000 }).usd, 8.33);
  // 1M/month: Ultimate (12.5M) would expire half-used ($625/month); Scale $0.50/1k -> $500
  assert.equal(monthlyCost(P.serper, { searches: 1000000 }).usd, 500);
  // 3M/month: Ultimate is used up in time -> $0.30/1k
  assert.equal(monthlyCost(P.serper, { searches: 3000000 }).usd, 900);
});

test('SerpApi: smallest plan that covers the volume, null above 30k', () => {
  assert.equal(monthlyCost(P.serpapi, { searches: 200 }).usd, 0);
  assert.equal(monthlyCost(P.serpapi, { searches: 200, freeTier: false }).usd, 25);
  assert.equal(monthlyCost(P.serpapi, { searches: 10000 }).usd, 150);
  assert.equal(monthlyCost(P.serpapi, { searches: 50000 }).usd, null);
});

test('Firecrawl: 2 credits per 10 results, 1 per scraped page, plan prices', () => {
  // 1k searches x 10 results = 2k credits + 3k scrapes = 5k -> Hobby $16
  assert.equal(monthlyCost(P.firecrawl, { searches: 1000, fetches: 3000 }).usd, 16);
  // 20 results doubles search credits
  assert.equal(monthlyCost(P.firecrawl, { searches: 1000, results: 20, fetches: 3000 }).usd, 83);
  assert.equal(monthlyCost(P.firecrawl, { searches: 400 }).usd, 0);
  assert.equal(monthlyCost(P.firecrawl, { searches: 1000000 }).usd, null);
});

test('rank puts cheapest full-coverage options first, unknowns last', () => {
  const rows = rank(PROVIDERS, { searches: 10000, fetches: 5000, now: AFTER_PROMO_END });
  assert.equal(rows[0].id, 'deepseek');
  const firstSearchOnly = rows.findIndex((r) => r.searchOnly);
  assert.ok(rows.slice(firstSearchOnly).every((r) => r.searchOnly || r.usd == null));
  assert.equal(rows.length, PROVIDERS.length);
});
