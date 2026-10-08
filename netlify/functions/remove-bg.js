export default async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) return Response.json({ error: 'REMOVEBG_API_KEY belum diset di Netlify.' }, { status: 500 });
  const input = await request.arrayBuffer();
  if (!input.byteLength || input.byteLength > 22 * 1024 * 1024) {
    return Response.json({ error: 'File kosong atau melebihi 22 MB.' }, { status: 413 });
  }
  const type = request.headers.get('content-type') || 'image/jpeg';
  const form = new FormData();
  form.append('size', 'auto');
  form.append('image_file', new Blob([input], { type }), 'upload');
  const r = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status, headers: {'Content-Type':'application/json'} });
  return new Response(await r.arrayBuffer(), { status: 200, headers: {'Content-Type':'image/png','Cache-Control':'no-store'} });
};
