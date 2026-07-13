self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Web Share Target: Android delivers a shared screenshot / link here as a POST to
// /share (multipart form). We can't pass a file through a URL, so we stash it in
// the Cache, then redirect into the app which reads it back on load.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith((async () => {
      try {
        const form = await event.request.formData();
        const text = form.get('text') || form.get('url') || form.get('title') || '';
        const files = form.getAll('media');
        const cache = await caches.open('cl-share');
        await cache.put('shared-text', new Response(String(text)));
        const img = files.find((f) => f && f.type && f.type.startsWith('image/'));
        if (img) await cache.put('shared-file', new Response(img, { headers: { 'content-type': img.type } }));
        else await cache.delete('shared-file');
        return Response.redirect('/?shared=1', 303);
      } catch (e) {
        return Response.redirect('/?shared=err', 303);
      }
    })());
  }
});
