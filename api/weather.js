export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${parseFloat(lat)}&lon=${parseFloat(lon)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'AlleVeier/1.0 github.com/fyttikatta/alleveier',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error('Met.no HTTP ' + r.status);
    const data = await r.json();
    // No caching - always fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).json(data);
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
