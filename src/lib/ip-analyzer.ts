// src/lib/ip-analyzer.ts
import { NextRequest } from 'next/server';

const CLOUD_PROVIDERS = [
  'amazon', 'aws', 'google', 'google cloud', 'microsoft', 'azure',
  'digitalocean', 'linode', 'vultr', 'ovh', 'cloudflare', 'vercel', 'netlify'
];

// Function 1: Get IP Address (Syntax Error fix included)
export const getIpAddress = (request: NextRequest): string => {
  // Parentheses used to fix operator precedence error
  const ip = (
    request.headers.get('cf-connecting-ip') || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  );
  return ip || (request.ip ?? '::1');
};

// Function 2: Analyze IP (Residential vs Datacenter)
export const analyzeIp = async (ip: string): Promise<{ isResidential: boolean, countryCode: string }> => {
  if (!ip || ip === '::1' || ip === '0.0.0.0') {
    return { isResidential: false, countryCode: 'X' };
  }

  try {
    const apiKey = process.env.IP_API_KEY;
    const url = `https://pro.ip-api.com/json/${ip}?key=${apiKey}&fields=countryCode,org,type`;

    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
       return { isResidential: true, countryCode: 'UNKNOWN' };
    }
    
    const data: any = await response.json();
    const org = (data.org || '').toLowerCase();
    const type = (data.type || '').toLowerCase();
    
    // Check if Cloud
    const isCloud = CLOUD_PROVIDERS.some(p => org.includes(p.split(' ')[0]));
    const isHosting = type === 'hosting' || type === 'datacenter';

     // Aakhir mein return check karein
return {
  isResidential: !(isCloud || isHosting),
  countryCode: data.countryCode || 'UNKNOWN' // Agar API fail ho jaye toh Unknown aayega
};
  } catch (error) {
    console.error('IP Check Failed:', error);
    return { isResidential: true, countryCode: 'UNKNOWN' };
  }
};
