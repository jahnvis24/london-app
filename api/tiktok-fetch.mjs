import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIKWM_API_BASE = 'https://api.tikwmapi.com';

const KEYWORDS = [
  "things to do London",
  "hidden gems London",
  "restaurants London",
  "bars London",
  "London food",
  "London experiences",
  "London brunch",
  "London cocktail bars",
  "South London things to do",
  "East London restaurants",
  "North London hidden gems",
  "West London bars",
  "Peckham things to do",
  "Shoreditch bars",
  "Brixton nightlife",
  "London date ideas",
  "London solo activities",
  "London rooftop bars",
  "London markets",
  "London galleries",
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
    const params = new URLSearchParams({ keywords: keyword, count: '30', cursor: '0' });
    const resp = await fetch(`${TIKWM_API_BASE}/feed/search?${params}`, {
      method: 'GET',
      headers: { 'x-tikwmapi-key': process.env.TIKWM_API_TOKEN }
    });
    const text = await resp.text();
    console.log(`[keyword:${keyword}] status:${resp.status} body:${text.slice(0, 200)}`);
    if (!text || text.trim().startsWith('<')) return [];
    const data = JSON.parse(text);
    return data.data?.videos || data.data?.items || [];
  } catch (e) {
    console.error(`[keyword:${keyword}] error:`, e.message);
    return [];
  }
}

async function getUserVideos(username) {
  try {
    const params = new URLSearchParams({ unique_id: username, count: '30', cursor: '0' });
    const resp = await fetch(`${TIKWM_API_BASE}/user/posts?${params}`, {
      method: 'GET',
      headers: { 'x-tikwmapi-key': process.env.TIKWM_API_TOKEN }
    });
    const text = await resp.text();
    console.log(`[user:${username}] status:${resp.status} body:${text.slice(0, 200)}`);
    if (!text || text.trim().startsWith('<')) return [];
    const data = JSON.parse(text);
    const videos = data.data?.videos || data.data?.items || [];
    console.log(`[user:${username}] videos returned: ${videos.length}`);
    return videos;
  } catch (e) {
    console.error(`[user:${username}] error:`, e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allVideos = [];
  let queued = 0;

  // ── KEYWORDS: rotate 4 per run ──
  const cursorStr = await getConfig('tiktok_keyword_cursor') || '0';
  const cursor = parseInt(cursorStr);
  const keywordBatch = KEYWORDS.slice(cursor, cursor + 4);
  const nextCursor = (cursor + 4) >= KEYWORDS.length ? 0 : cursor + 4;

  console.log(`[keywords] running batch: ${keywordBatch}`);

  for (const keyword of keywordBatch) {
    await sleep(200);
    const videos = await searchTikTok(keyword);
    allVideos.push(...videos.map(v => ({ ...v, source: `keyword:${keyword}` })));
  }

  await setConfig('tiktok_keyword_cursor', String(nextCursor));

  // ── USERNAMES: run both batches independently every 10 days ──
  const lastUserBatch1 = await getConfig('tiktok_last_user_batch1') || '2000-01-01';
  const lastUserBatch2 = await getConfig('tiktok_last_user_batch2') || '2000-01-01';
  const daysSinceBatch1 = Math.floor((Date.now() - new Date(lastUserBatch1).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceBatch2 = Math.floor((Date.now() - new Date(lastUserBatch2).getTime()) / (1000 * 60 * 60 * 24));

  console.log(`[userBatch1] days since last run: ${daysSinceBatch1}`);
  console.log(`[userBatch2] days since last run: ${daysSinceBatch2}`);

  if (daysSinceBatch1 >= 10) {
    console.log(`[userBatch1] triggering for: ${USERNAMES_BATCH_1}`);
    for (const username of USERNAMES_BATCH_1) {
      await sleep(300);
      const videos = await getUserVideos(username);
      allVideos.push(...videos.map(v => ({ ...v, source: `user:${username}` })));
    }
    await setConfig('tiktok_last_user_batch1', new Date().toISOString().split('T')[0]);
  }

  if (daysSinceBatch2 >= 10) {
    console.log(`[userBatch2] triggering for: ${USERNAMES_BATCH_2}`);
    for (const username of USERNAMES_BATCH_2) {
      await sleep(300);
      const videos = await getUserVideos(username);
      allVideos.push(...videos.map(v => ({ ...v, source: `user:${username}` })));
    }
    await setConfig('tiktok_last_user_batch2', new Date().toISOString().split('T')[0]);
  }

  // Deduplicate and queue raw captions
  const unique = [...new Map(
    allVideos.filter(v => v.video_id).map(v => [v.video_id, v])
  ).values()];

  console.log(`[dedup] total unique videos: ${unique.length}`);

  for (const video of unique) {
    const caption = (video.title || '').slice(0, 800).replace(/[\u0000-\u001F\u007F]/g, ' ');
    if (!caption || caption.length < 20) continue;

    const tiktokUrl = `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;

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

  console.log(`[done] videos_found:${unique.length} queued:${queued}`);

  res.status(200).json({
    message: 'Fetch complete',
    videos_found: unique.length,
    queued
  });
}
