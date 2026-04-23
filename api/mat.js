export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) { res.status(500).json({ error: 'NO_KEY' }); return; }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=20000&type=restaurant&rankby=prominence&language=no&key=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('Google HTTP ' + r.status);
    const data = await r.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(data.status);
    const places = (data.results || []).map(p => ({
      name: p.name,
      rating: p.rating || null,
      reviews: p.user_ratings_total || 0,
      type: p.types?.[0] || 'restaurant',
      address: p.vicinity || null,
      open: p.opening_hours?.open_now ?? null,
      lat: p.geometry.location.lat,
      lon: p.geometry.location.lng,
      place_id: p.place_id,
    }));
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json({ places });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
