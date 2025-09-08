// Debug endpoint to check environment variables
// This will help us see what's happening in the Vercel environment

module.exports = (req, res) => {
    try {
        // Only allow GET requests
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Check if DATABASE_URL exists and show its format (without revealing the actual value)
        const dbUrl = process.env.DATABASE_URL;
        const hasDbUrl = !!dbUrl;
        const dbUrlFormat = dbUrl ? {
            length: dbUrl.length,
            starts_with: dbUrl.substring(0, 20) + '...',
            contains_host: dbUrl.includes('supabase.co'),
            contains_postgres: dbUrl.startsWith('postgresql://'),
            host_extracted: dbUrl.match(/(@[^:]+)/)?.[1] || 'not_found'
        } : null;

        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            has_database_url: hasDbUrl,
            database_url_info: dbUrlFormat,
            vercel_region: process.env.VERCEL_REGION,
            vercel_url: process.env.VERCEL_URL,
            node_version: process.version,
            platform: process.platform,
            arch: process.arch
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(debugInfo);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
