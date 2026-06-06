import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── ZONE CLASSIFIER (same as enrich-venue.mjs) ─────────────
const NEIGHBOURHOOD_ZONES = {
  'soho': 'Central', 'covent garden': 'Central', 'fitzrovia': 'Central',
  'bloomsbury': 'Central', 'holborn': 'Central', 'westminster': 'Central',
  'piccadilly': 'Central', 'the strand': 'Central', 'trafalgar': 'Central',
  'clerkenwell': 'Central', 'farringdon': 'Central',
  "king's cross": 'Central', 'kings cross': 'Central', 'euston': 'Central',
  'south bank': 'Central', 'bankside': 'Central',
  'pimlico': 'Central',
  'shoreditch': 'East', 'hoxton': 'East', 'bethnal green': 'East',
  'whitechapel': 'East', 'spitalfields': 'East', 'mile end': 'East',
  'bow': 'East', 'stratford': 'East', 'canary wharf': 'East',
  'poplar': 'East', 'limehouse': 'East', 'old street': 'East',
  'hackney': 'East', 'dalston': 'East', 'de beauvoir': 'East',
  'islington': 'North', 'angel': 'North', 'highbury': 'North',
  'camden': 'North', 'kentish town': 'North', 'holloway': 'North',
  'finsbury park': 'North', 'archway': 'North', 'highgate': 'North',
  'crouch end': 'North', 'muswell hill': 'North', 'stoke newington': 'North',
  'hampstead': 'Northwest', 'kilburn': 'Northwest', "queen's park": 'Northwest',
  'queens park': 'Northwest', 'maida vale': 'Northwest', "st john's wood": 'Northwest',
  'swiss cottage': 'Northwest', 'wembley': 'Northwest', 'harrow': 'Northwest',
  'clapton': 'Northeast', 'walthamstow': 'Northeast', 'leyton': 'Northeast',
  'tottenham': 'Northeast', 'wood green': 'Northeast',
  'mayfair': 'West', 'marylebone': 'Central', 'notting hill': 'West',
  'kensington': 'West', 'chelsea': 'West', 'knightsbridge': 'West',
  'holland park': 'West', "shepherd's bush": 'West', 'shepherds bush': 'West',
  'hammersmith': 'West', 'fulham': 'West', 'chiswick': 'West',
  'clapham': 'Southwest', 'battersea': 'Southwest', 'brixton': 'South',
  'putney': 'Southwest', 'tooting': 'Southwest', 'balham': 'Southwest',
  'wandsworth': 'Southwest', 'richmond': 'Southwest', 'wimbledon': 'Southwest',
  'kingston': 'Southwest',
  'peckham': 'Southeast', 'bermondsey': 'Southeast', 'london bridge': 'Southeast',
  'borough': 'Southeast', 'camberwell': 'Southeast', 'dulwich': 'Southeast',
  'greenwich': 'Southeast', 'deptford': 'Southeast', 'new cross': 'Southeast',
  'lewisham': 'Southeast', 'elephant and castle': 'Southeast',
  'kennington': 'South', 'stockwell': 'South', 'vauxhall': 'South',
};

function zoneFromAddress(address) {
  if (!address) return null;
  const addr = address.toLowerCase();
  for (const [neighbourhood, zone] of Object.entries(NEIGHBOURHOOD_ZONES)) {
    const regex = new RegExp(`\\b${neighbourhood.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(addr)) return zone;
  }
  return null;
}

function zoneFromPostcode(postcode) {
  if (!postcode) return null;
  const pc = postcode.trim().toUpperCase().replace(/\s/g, '');
  if (pc.startsWith('WC') || pc.startsWith('EC')) return 'Central';
  if (/^W1[A-Z]/.test(pc)) return 'Central';
  if (/^SW1[A-Z]/.test(pc)) return 'Central';
  if (/^NW1[A-Z]/.test(pc)) return 'Central';
  if (pc.startsWith('NW3') || pc.startsWith('NW11')) return 'Northwest';
  if (pc.startsWith('NW') || pc.startsWith('HA') || pc.startsWith('WD') || pc.startsWith('AL')) return 'Northwest';
  if (pc.startsWith('N6')) return 'Northwest';
  if (pc.startsWith('N') || pc.startsWith('EN')) return 'North';
  if (pc.startsWith('E') || pc.startsWith('RM') || pc.startsWith('IG')) return 'East';
  if (pc.startsWith('SE') || pc.startsWith('CR') || pc.startsWith('BR') || pc.startsWith('DA')) return 'Southeast';
  if (pc.startsWith('SW') || pc.startsWith('TW') || pc.startsWith('KT') || pc.startsWith('SM')) return 'Southwest';
  if (pc.startsWith('W') || pc.startsWith('UB')) return 'West';
  return null;
}

function classifyZone(postcode, address) {
  return zoneFromAddress(address) || zoneFromPostcode(postcode) || null;
}

// ── MAIN ────────────────────────────────────────────────────
export default async function handler(req, res) {
  const dryRun = req.query?.dry !== 'false';

  const { data: venues, error } = await supabase
    .from("experiences")
    .select("id, name, address, postcode, zone")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const changes = [];
  const unchanged = [];
  const unclassifiable = [];

  for (const v of venues) {
    const newZone = classifyZone(v.postcode, v.address);
    if (!newZone) {
      unclassifiable.push({ id: v.id, name: v.name, currentZone: v.zone });
      continue;
    }
    if (newZone !== v.zone) {
      changes.push({ id: v.id, name: v.name, oldZone: v.zone, newZone, address: v.address, postcode: v.postcode });
    } else {
      unchanged.push({ id: v.id, name: v.name, zone: v.zone });
    }
  }

  if (!dryRun && changes.length > 0) {
    for (const c of changes) {
      await supabase.from("experiences").update({ zone: c.newZone }).eq("id", c.id);
    }
  }

  res.status(200).json({
    mode: dryRun ? "DRY RUN (add ?dry=false to apply)" : "APPLIED",
    total: venues.length,
    changes: changes.length,
    unchanged: unchanged.length,
    unclassifiable: unclassifiable.length,
    diff: changes,
    unclassifiable_venues: unclassifiable,
  });
}
