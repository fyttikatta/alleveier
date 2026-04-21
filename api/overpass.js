export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const query = req.query.data || req.body?.data;
  if (!query) { res.status(400).json({ error: 'Missing query' }); return; }

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  for (const url of mirrors) {
    try {
      const r = await fetch(url + '?data=' + encodeURIComponent(query), {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'AlleVeier/1.0' }
      });
      if (!r.ok) continue;
      const data = await r.json();
      res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 min
      res.status(200).json(data);
      return;
    } catch (e) { continue; }
  }
  res.status(503).json({ error: 'Alle Overpass-servere utilgjengelige' });
}
