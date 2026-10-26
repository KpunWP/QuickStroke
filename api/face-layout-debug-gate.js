// No report payloads, writes or secrets. POST avoids the existing GET-only Service Worker cache.
module.exports = function faceLayoutDebugGate(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Host');
  const env = process.env;
  const host = String(env.VERCEL_URL || '').toLowerCase();
  const sha = String(env.VERCEL_GIT_COMMIT_SHA || '');
  const allowed = env.VERCEL === '1' && env.VERCEL_ENV === 'preview' &&
    (!env.VERCEL_TARGET_ENV || env.VERCEL_TARGET_ENV === 'preview') &&
    /^[a-z0-9-]+\.vercel\.app$/.test(host) && /^[a-f0-9]{40}$/.test(sha) &&
    String(req.headers.host || '').toLowerCase() === host;
  let explicit = false;
  try { explicit = new URL(req.url, 'https://' + host).searchParams.get('faceLayoutDebug') === '1'; } catch (_) {}
  if (!allowed || !explicit) return res.status(404).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (Number(req.headers['content-length'] || 0) > 0 || req.headers['transfer-encoding']) return res.status(400).end();
  return res.status(200).json({ schema: 1, preview: true, host, sha });
};
