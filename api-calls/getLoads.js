import fetch from 'node-fetch';

export async function burblequery(cookie) {
  const dzid = process.env.DZ_ID;

  const url = 'https://dzm.burblesoft.com/ajax_dzm2_frontend_jumpermanifestpublic';
  const headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'XMLHttpRequest',
    'cookie': cookie,
    'Origin': 'https://dzm.burblesoft.com',
    'Referer': 'https://dzm.burblesoft.com/jmp',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  const payload = `columns=8&display_tandem=1&display_student=1&display_sport=1&display_menu=1&font_size=0&action=getLoads&dz_id=${dzid}&date_format=d%2Fm%2FY&acl_application=Burble%20DZM`;
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: payload
  });
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text);
    throw e;
  }
}
// Test 
// const data = await burblequery();
// console.log(data);