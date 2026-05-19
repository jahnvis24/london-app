import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEYWORDS = [
  "things to do London",
  "hidden gems London",
  "restaurants London",
  "bars London",
  "London food",
  "London experiences",
];

const USERNAMES_BATCH_1 = [
  "aleks.london.diary",
  "runawaywithrachel",
  "sineadtravels",
  "livs_london",
];

const USERNAMES_BATCH_2 = [
  "somethingsomethingbeauty",
  "annasabroad",
  "secret.london",
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getConfig(key) {
  const { data } = await supabase.from('app_config').select('value').eq('key', key).single();
  return data?.value || null;
}

async function setConfig(key, value) {
  await supabase.from('app_config').upsert({ key, value, updated_at: new Date().toISOString() });
}

async function searchTikTok(keyword) {
  try {
    const resp = await fetch('https://tikwm.com/api/feed/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ keywords: keyword, count: '10', cursor: '0' }).toString()
    });
    const text = await resp.text();
    if (!text || text.trim().startsWith('<')) return [];
    const data = JSON.parse(text);
    return data.data?.videos || data.data?.items || [];
  } catch { return []; }
}

async function getUserVideos(username) {
  try {
    const resp = await fetch('https://tikwm.com/api/user/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ unique_id: username, count: '80', cursor: '0' }).toString()
    });
    const text = await resp.text();
    if (!text || text.trim().startsWith('<')) return [];
    const data = JSON.parse(text);
    return data.data?.videos || data.data?.items || [];
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allVideos = [];
  let queued = 0;

  // ── KEYWORDS: rotate 2 per day ──
  const cursorStr = await getConfig('tiktok_keyword_cursor') || '0';
  const cursor = parseInt(cursorStr);
  const keywordBatch = KEYWORDS.slice(cursor, cursor + 2);
  const nextCursor = (cursor + 2) >= KEYWORDS.length ? 0 : cursor + 2;

  for (const keyword of keywordBatch) {
    await sleep(200);
    const videos = await searchTikTok(keyword);
    allVideos.push(...videos.map(v => ({ ...v, source: `keyword:${keyword}` })));
  }

  await setConfig('tiktok_keyword_cursor', String(nextCursor));

  // ── USERNAMES: split across 2 days every 10 days ──
  const lastUserBatch1 = await getConfig('tiktok_last_user_batch1') || '2000-01-01';
  const lastUserBatch2 = await getConfig('tiktok_last_user_batch2') || '2000-01-01';
  const daysSinceBatch1 = Math.floor((Date.now() - new Date(lastUserBatch1).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceBatch2 = Math.floor((Date.now() - new Date(lastUserBatch2).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceBatch1 >= 10) {
    for (const username of USERNAMES_BATCH_1) {
      await sleep(300);
      const videos = await getUserVideos(username);
      allVideos.push(...videos.map(v => ({ ...v, source: `user:${username}` })));
    }
    await setConfig('tiktok_last_user_batch1', new Date().toISOString().split('T')[0]);
  } else if (daysSinceBatch2 >= 10) {
    for (const username of USERNAMES_BATCH_2) {
      await sleep(300);
      const videos = await getUserVideos(username);
      allVideos.push(...videos.map(v => ({ ...v, source: `user:${username}` })));
    }
    await setConfig('tiktok_last_user_batch2', new Date().toISOString().split('T')[0]);
  }

  // Deduplicate and queue raw captions — no Claude calls here
  const unique = [...new Map(
    allVideos.filter(v => v.video_id).map(v => [v.video_id, v])
  ).values()];

  for (const video of unique) {
    const caption = (video.title || '').slice(0, 800).replace(/[\u0000-\u001F\u007F]/g, ' ');
    if (!caption || caption.length < 20) continue;

    const tiktokUrl = `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;

    // Only queue if not already in pending_videos or experiences
    const { data: existing } = await supabase
      .from('pending_videos')
      .select('id')
      .eq('tiktok_url', tiktokUrl)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { data: existingExp } = await supabase
      .from('experiences')
      .select('id')
      .eq('tiktok_url', tiktokUrl)
      .limit(1);

    if (existingExp && existingExp.length > 0) continue;

    await supabase.from('pending_videos').insert({
      tiktok_url: tiktokUrl,
      caption,
      source: video.source || 'unknown',
      processed: false
    });

    queued++;
  }

  res.status(200).json({
    message: 'Fetch complete',
    videos_found: unique.length,
    queued
  });
}