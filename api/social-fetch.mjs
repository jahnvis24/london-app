// Combined social media fetcher — runs both TikTok and Instagram scraping
// in a single cron job to stay within Vercel Hobby's 2-cron limit.

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = { tiktok: null, instagram: null };

  // Run TikTok fetch
  try {
    const { default: tiktokFetch } = await import('./tiktok-fetch.mjs');
    const tiktokRes = { status: (code) => ({ json: (data) => { results.tiktok = { code, ...data }; return tiktokRes; } }), ...res };
    await tiktokFetch({ method: 'GET' }, { status: (code) => ({ json: (data) => { results.tiktok = { status: code, ...data }; } }) });
  } catch (e) {
    results.tiktok = { error: e.message };
  }

  // Run Instagram fetch
  try {
    const { default: igFetch } = await import('./instagram-fetch.mjs');
    await igFetch({ method: 'GET' }, { status: (code) => ({ json: (data) => { results.instagram = { status: code, ...data }; } }) });
  } catch (e) {
    results.instagram = { error: e.message };
  }

  res.status(200).json({ message: 'Social fetch complete', results });
}
