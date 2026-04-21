export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${parseFloat(lat).toFixed(4)}&lon=${parseFloat(lon).toFixed(4)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'AlleVeier/1.0 github.com/fyttikatta/alleveier',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error('Met.no HTTP ' + r.status);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=1800'); // cache 30 min
    res.status(200).json(data);
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
