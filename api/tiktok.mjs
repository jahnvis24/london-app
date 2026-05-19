export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'tikwm.com',
      }
    });
    const data = await response.json();

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