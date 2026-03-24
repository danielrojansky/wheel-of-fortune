export default function handler(req, res) {
  res.json({
    ok: true,
    hasUrl: !!process.env.KV_REST_API_URL,
    hasToken: !!process.env.KV_REST_API_TOKEN,
    nodeVersion: process.version,
  });
}
