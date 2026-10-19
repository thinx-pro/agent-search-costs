// Monthly cost of a search / fetch workload for each provider in prices.js.
// Pure functions: used by index.html and by test/calc.test.js.

const round2 = (n) => Math.round(n * 100) / 100;

function perK(spec, count, results) {
  if (!spec || !count) return 0;
  let usd = (count / 1000) * spec.usdPerK;
  if (spec.includedResults && results > spec.includedResults) {
    usd += ((results - spec.includedResults) * count * spec.extraResultUsdPerK) / 1000;
  }
  return usd;
}

function creditsNeeded(p, w) {
  let c = 0;
  if (w.searches) {
    const per = p.search.creditsPerRequest * (w.advanced && p.id === 'tavily' ? 2 : 1);
    const blocks = p.search.perResults ? Math.ceil(Math.max(1, w.results) / p.search.perResults) : 1;
    c += w.searches * per * blocks;
  }
  if (w.fetches && p.fetch) c += w.fetches * p.fetch.creditsPerRequest;
  return Math.ceil(c);
}

// Cheapest way to buy `credits` per month under a credits model (free tier, pay-as-you-go, plans).
function cheapestCredits(cr, credits, useFree) {
  const options = [];
  if (useFree && credits <= cr.freeCredits) options.push({ usd: 0, label: 'free tier' });
  if (cr.paygUsd != null) {
    const billable = Math.max(0, credits - (useFree ? cr.freeCredits : 0));
    options.push({ usd: billable * cr.paygUsd, label: 'pay as you go' });
  }
  for (const plan of cr.plans) if (plan.includes >= credits) options.push({ usd: plan.usd, label: `${plan.name} plan` });
  if (!options.length) return null;
  return options.reduce((a, b) => (b.usd < a.usd ? b : a));
}

// Serper: prepaid packs valid N months. Buying a pack you cannot use up in time wastes the rest.
function cheapestPack(p, perMonth) {
  let best = null;
  for (const pack of p.packs) {
    const rate = pack.usd / pack.credits;
    const usd = Math.max(perMonth * rate, pack.usd / p.packMonths);
    if (!best || usd < best.usd) best = { usd, label: `${pack.name} pack ($${(rate * 1000).toFixed(2)} / 1k)` };
  }
  return best;
}

function cheapestPlan(plans, perMonth) {
  const fit = plans.filter((x) => x.includes >= perMonth);
  if (!fit.length) return null;
  const plan = fit.reduce((a, b) => (b.usd < a.usd ? b : a));
  return { usd: plan.usd, label: `${plan.name} plan` };
}

/**
 * @param {object} p        provider from prices.js
 * @param {object} w        workload: { searches, fetches, results, advanced, freeTier, promo, now }
 * @returns {{id, name, usd: number|null, label: string, searchOnly: boolean, promoApplied: boolean, notes: string[]}}
 */
export function monthlyCost(p, w) {
  const work = { searches: 0, fetches: 0, results: 10, advanced: false, freeTier: true, promo: false, now: new Date(), ...w };
  const notes = [];
  const searchOnly = !p.fetch && work.fetches > 0;
  if (searchOnly) notes.push('no fetch endpoint: page fetching not included');
  let usd = null;
  let label = '';

  if (p.search.kind === 'perK') {
    const fetchUsd = p.fetch ? perK(p.fetch, work.fetches, 0) : 0;
    usd = perK(p.search, work.searches, work.results) + fetchUsd;
    if (work.freeTier && p.freeMonthly) {
      usd = Math.max(0, usd - p.freeMonthly.usd);
      label = `after $${p.freeMonthly.usd} monthly credit`;
    } else label = 'pay per request';
    if (p.search.includedResults && work.results > p.search.includedResults) notes.push(`${work.results - p.search.includedResults} extra results per search billed`);
  } else if (p.search.kind === 'credits') {
    const credits = creditsNeeded(p, work);
    const best = cheapestCredits(p.credits, credits, work.freeTier);
    if (best) {
      usd = best.usd;
      label = `${best.label} · ${credits.toLocaleString('en-US')} credits`;
    } else {
      label = `${credits.toLocaleString('en-US')} credits: above the largest listed plan`;
    }
  } else if (p.search.kind === 'packs') {
    const best = cheapestPack(p, work.searches);
    usd = work.searches ? best.usd : 0;
    label = work.searches ? best.label : '';
  } else if (p.search.kind === 'plans') {
    const usable = work.freeTier ? p.plans : p.plans.filter((x) => x.usd > 0);
    const best = cheapestPlan(usable, work.searches);
    if (best) {
      usd = best.usd;
      label = best.label;
    } else label = 'above the largest listed plan';
  }

  let promoApplied = false;
  if (work.promo && p.promo && new Date(work.now) < new Date(p.promo.until)) {
    promoApplied = true;
    notes.push('free via Claude Code / Codex until 1 Nov 2026');
    label = `free until 1 Nov 2026, then $${round2(usd ?? 0).toFixed(2)} / month`;
    usd = 0;
  }
  return { id: p.id, name: p.name, usd: usd == null ? null : round2(usd), label, searchOnly, promoApplied, notes };
}

export function rank(providers, w) {
  const rows = providers.map((p) => monthlyCost(p, w));
  const key = (r) => [r.usd == null ? 1 : 0, r.searchOnly ? 1 : 0, r.usd ?? Infinity];
  return rows.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return 0;
  });
}
