export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lat, lon } = req.query;
  if (!lat || !lon) { res.status(400).json({ error: 'Missing lat/lon' }); return; }

  try {
    // NVDB objekt type 39 = Rasteplass
    // Søk innen 80km radius fra koordinat
    const url = `https://nvdbapiles-v3.atlas.vegvesen.no/vegobjekter/39?inkluder=egenskaper,lokasjon,geometri&srid=wgs84&radius=80000&kartutsnitt=${parseFloat(lon)-1},${parseFloat(lat)-0.7},${parseFloat(lon)+1},${parseFloat(lat)+0.7}&antall=50`;

    const r = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.vegvesen.nvdb-v3-rev1+json',
        'X-Client': 'AlleVeier/1.0',
        'X-Kontaktperson': 'alleveier@example.com'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!r.ok) throw new Error('NVDB HTTP ' + r.status);
    const data = await r.json();

    // Parse og returner forenklet format
    const items = (data.objekter || []).map(obj => {
      const props = obj.egenskaper || [];
      const getName = (id) => props.find(p => p.id === id)?.verdi || null;
      const getVal = (id) => props.find(p => p.id === id)?.verdi || null;

      const name = getName(6914) || getName(1079) || null; // Navn / Skiltnavn
      const type = getVal(6915) || getVal(1078) || null;   // Type rasteplass
      const toilet = getVal(8129) === 'Ja' || getVal(1080) === 'Ja';
      const table = getVal(8130) === 'Ja';
      const fire = getVal(8131) === 'Ja';
      const handicap = getVal(8132) === 'Ja';

      const geo = obj.geometri?.wkt || null;
      let lat2 = null, lon2 = null;
      if (geo) {
        const match = geo.match(/POINT\s*\(([0-9.]+)\s+([0-9.]+)\)/);
        if (match) { lon2 = parseFloat(match[1]); lat2 = parseFloat(match[2]); }
      }
      // Fallback til lokasjon
      if (!lat2 && obj.lokasjon?.geometri?.wkt) {
        const m = obj.lokasjon.geometri.wkt.match(/POINT\s*\(([0-9.]+)\s+([0-9.]+)\)/);
        if (m) { lon2 = parseFloat(m[1]); lat2 = parseFloat(m[2]); }
      }

      return { id: obj.id, name, type, toilet, table, fire, handicap, lat: lat2, lon: lon2 };
    }).filter(i => i.lat && i.lon);

    res.setHeader('Cache-Control', 's-maxage=86400'); // cache 24h
    res.status(200).json({ items });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
}
