// Vercel serverless function for health check
export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check environment variables
    const hasDatabase = !!process.env.DATABASE_URL;
    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    
    res.status(200).json({
        status: 'healthy',
        database: hasDatabase ? 'configured' : 'not configured',
        supabase: hasSupabase ? 'configured' : 'not configured',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
    });
}