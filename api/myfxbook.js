// Vercel serverless function — proxies requests to the Myfxbook API to avoid CORS issues.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { action, ...params } = req.query;
  if (!action) { res.status(400).json({ error: 'Missing action' }); return; }

  const url = new URL(`https://www.myfxbook.com/api/${action}.json`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Myfxbook API request failed', detail: err.message });
  }
}
