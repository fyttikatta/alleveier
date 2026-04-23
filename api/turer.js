export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  try {
    // Nasjonal Turbase API - same data as ut.no
    const url = `https://api.nasjonalturbase.no/turer?lat=${lat}&lng=${lon}&radius=50&antall=30`;
    const r = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlleVeier/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!r.ok) throw new Error('NTB HTTP ' + r.status);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(data);
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
