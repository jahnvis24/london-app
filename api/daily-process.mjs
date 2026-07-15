// Combined daily processor — expires old events then processes pending videos.
// Consolidates expire-events + process-videos into one cron to stay within limits.

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = { expire: null, process: null };

  try {
    const { default: expireHandler } = await import('./expire-events.mjs');
    await expireHandler({ method: 'GET' }, { status: (code) => ({ json: (data) => { results.expire = { status: code, ...data }; } }) });
  } catch (e) {
    results.expire = { error: e.message };
  }

  try {
    const { default: processHandler } = await import('./process-videos.mjs');
    await processHandler({ method: 'GET' }, { status: (code) => ({ json: (data) => { results.process = { status: code, ...data }; } }) });
  } catch (e) {
    results.process = { error: e.message };
  }

  res.status(200).json({ message: 'Daily processing complete', results });
}
