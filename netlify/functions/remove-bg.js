export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.REMOVEBG_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'REMOVEBG_API_KEY belum diset di Netlify.' },
      { status: 500 }
    );
  }

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: 'Konfigurasi Supabase belum lengkap di Netlify.' },
      { status: 500 }
    );
  }

  const input = await request.arrayBuffer();

  if (!input.byteLength || input.byteLength > 22 * 1024 * 1024) {
    return Response.json(
      { error: 'File kosong atau melebihi 22 MB.' },
      { status: 413 }
    );
  }

  const type = request.headers.get('content-type') || 'image/jpeg';

  const form = new FormData();
  form.append('size', 'auto');
  form.append(
    'image_file',
    new Blob([input], { type }),
    'upload'
  );

  // Kirim gambar ke remove.bg
  const r = await fetch(
    'https://api.remove.bg/v1.0/removebg',
    {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: form
    }
  );

  // Kalau remove.bg gagal, jangan tambah counter
  if (!r.ok) {
    return new Response(await r.text(), {
      status: r.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Background removal berhasil → tambah counter Supabase
  try {
    const statsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/increment_excision_processed`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      }
    );

    if (!statsResponse.ok) {
      console.error(
        'Gagal update counter Supabase:',
        await statsResponse.text()
      );
    }
  } catch (error) {
    // Jangan sampai error statistik membuat hasil gambar gagal
    console.error('Supabase counter error:', error);
  }

  // Kembalikan hasil PNG
  return new Response(await r.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store'
    }
  });
};
