
// src/lib/detection.ts
import { NextRequest } from 'next/server';

// Known Bots List
const KNOWN_BOTS = [
  'bot', 'crawl', 'spider', 'scraper', 'headless', 'curl', 'wget', 'python',
  'facebookexternalhit', 'googlebot', 'bingbot', 'yandexbot', 'duckduckbot',
  'semrushbot', 'applebot', 'pingdom', 'slurp'
];

// Ad Sources (Referrers + UTM)
const AD_PARAMS = ['gclid', 'gclsrc', 'fbclid', 'utm_medium', 'utm_source'];
const AD_REFERRERS = [
  'google.com', 'doubleclick.net', 'googlesyndication.com',
  'facebook.com', 'instagram.com', 'bing.com', 'yahoo.com'
];

// 1. Check if User-Agent is a Bot
export const detectUserAgent = (ua: string) => {
  if (!ua) return { isBot: true, reason: 'Empty UA' };
  const lower = ua.toLowerCase();
  
  for (const bot of KNOWN_BOTS) {
    if (lower.includes(bot)) return { isBot: true, reason: `Matched ${bot}` };
  }
  if (lower.includes('crawler') || lower.includes('spider')) return { isBot: true, reason: 'Generic' };
  
  return { isBot: false, reason: 'Human' };
};

// 2. Check if Device is Mobile
export const isMobile = (ua: string) => {
  return /Mobile|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
};

// 3. Check if Traffic comes from Ad
export const hasAdIntent = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const referrer = request.headers.get('referer') || '';

  // URL Params Check
  let match = false;
  for (const p of AD_PARAMS) {
    if (searchParams.has(p)) match = true;
  }
  if (['cpc', 'cpm', 'paid', 'ppc'].includes(searchParams.get('utm_medium')?.toLowerCase() || '')) match = true;

  // Referrer Check
  if (referrer) {
    for (const src of AD_REFERRERS) {
      if (referrer.toLowerCase().includes(src)) match = true;
    }
  }

  return match;
};
