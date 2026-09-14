import { requireUser, applyCors } from './_auth.mjs';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Spends TikWM quota — signed-in callers only.
  if (!(await requireUser(req, res))) return;

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const params = new URLSearchParams({ url, hd: '1' });
    const response = await fetch(`https://api.tikwmapi.com/?${params}`, {
      method: 'GET',
      headers: {
        'x-tikwmapi-key': process.env.TIKWM_API_TOKEN
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('tikwmapi returned invalid response: ' + text.slice(0, 100));
    }

    if (data.code !== 0) throw new Error(data.msg || 'Failed to fetch TikTok data');

    const video = data.data;
    res.status(200).json({
      title: video.title || '',
      description: video.title || '',
      author: video.author?.nickname || '',
      cover: video.cover || '',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
