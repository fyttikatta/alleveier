export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  try {
    const latF = parseFloat(lat), lonF = parseFloat(lon);
    const pad = 2.5;
    const bbox = `${lonF-pad},${latF-pad},${lonF+pad},${latF+pad}`;
    const url = `https://www.vegvesen.no/ws/no/vegvesen/veg/trafikkinformasjon/v2/situasjoner.json?bbox=${bbox}&srid=4326`;

    const r = await fetch(url, {
      headers: { 'User-Agent': 'AlleVeier/1.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!r.ok) throw new Error('Vegvesen HTTP ' + r.status);
    const data = await r.json();

    const raw = data.situasjoner || data.results || (Array.isArray(data) ? data : []);
    const items = raw.slice(0, 30).map(s => ({
      id: s.situasjonsId || s.id || null,
      type: s.situasjonstype || s.type || 'Hendelse',
      title: s.tittel || s.title || s.overskrift || null,
      desc: s.beskrivelse || s.description || null,
      road: s.vegreferanse || s.lokasjon?.vegreferanse || null,
      place: s.lokasjon?.stedsnavn || s.stedsnavn || null,
      severity: s.alvorlighetsgrad || 'normal',
      start: s.startTid || s.startTime || null,
    }));

    res.setHeader('Cache-Control', 's-maxage=120');
    res.status(200).json({ items });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
