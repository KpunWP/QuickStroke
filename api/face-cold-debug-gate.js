// Empty authorization request only. No diagnostic payloads or writes.
module.exports = function gate(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Host');
  const e=process.env, host=String(e.VERCEL_URL||'').toLowerCase(), sha=String(e.VERCEL_GIT_COMMIT_SHA||'');
  let explicit=false;
  try { explicit=new URL(req.url,'https://'+host).searchParams.get('faceColdStartDebug')==='1'; } catch (_) {}
  if (e.VERCEL!=='1' || e.VERCEL_ENV!=='preview' ||
      (e.VERCEL_TARGET_ENV && e.VERCEL_TARGET_ENV!=='preview') ||
      !/^[a-z0-9-]+\.vercel\.app$/.test(host) || !/^[a-f0-9]{40}$/.test(sha) ||
      String(req.headers.host||'').toLowerCase()!==host || !explicit ||
      (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site']!=='same-origin')) return res.status(404).end();
  if(req.method!=='POST') return res.status(405).end();
  if(Number(req.headers['content-length']||0)>0 || req.headers['transfer-encoding']) return res.status(400).end();
  return res.status(200).json({schema:1,preview:true,host,sha});
};
