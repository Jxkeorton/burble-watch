
import fs from 'fs';
import fetch from 'node-fetch';

async function getCookie(dzid) {
  const url = `https://dzm.burblesoft.com/jmp?dz_id=${dzid}`;
  const headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
  };
  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
    redirect: 'manual',
  });
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No Set-Cookie header found');
  const match = setCookie.match(/burblesoft=([^;]+)/);
  if (!match) throw new Error('No burblesoft cookie found');
  const cookieValue = `burblesoft=${match[1]}`;
  console.log('Cookie Updated:', cookieValue);
  return cookieValue;
}

export async function updateCookie(dzid) {
  const cookiesPath = './cookies.json';
  let cookies = {};
  if (fs.existsSync(cookiesPath)) {
    cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  }
  const today = new Date();
  today.setHours(7, 0, 0, 0);
  if (!cookies[dzid] || new Date(cookies[dzid].timestamp) < today) {
    // If there is no cookie for the given dzid or the existing cookie is more than 48 hours old,
    // call the getCookie function to generate a new cookie and update the cookies array.
    cookies[dzid] = {
      cookie: await getCookie(dzid),
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  }
  return cookies[dzid].cookie;
}
  
const cookies = updateCookie(531);
console.log(cookies);