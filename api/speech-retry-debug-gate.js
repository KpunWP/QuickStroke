// Metadata-only authorization. Vercel Authentication remains platform-managed.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const enabled = req.method === 'POST' &&
    req.query?.speechRetryDebug === '1' &&
    process.env.VERCEL_ENV === 'preview' &&
    !!process.env.VERCEL_URL && req.headers.host === process.env.VERCEL_URL &&
    /^[a-f0-9]{40}$/.test(process.env.VERCEL_GIT_COMMIT_SHA || '');
  if (!enabled) return res.status(403).json({eligible:false});
  return res.status(200).json({eligible:true, sha:process.env.VERCEL_GIT_COMMIT_SHA});
};
