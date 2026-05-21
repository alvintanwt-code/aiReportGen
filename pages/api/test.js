// Simple test API endpoint
export default function handler(req, res) {
  console.log('[TEST_API] Request received');
  return res.status(200).json({
    success: true,
    message: 'API is working!'
  });
}
