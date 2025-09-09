// Server-side Supabase configuration endpoint
// This safely serves the public Supabase configuration to the client

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for localhost development
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    methods: ['GET'],
    credentials: true
}));

// Serve Supabase configuration
app.get('/api/config', (req, res) => {
    try {
        // Only serve public configuration (anon key is safe to expose)
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || 'https://sfsswfzgrdctiyukhczj.supabase.co',
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null
        };
        
        if (!config.supabaseAnonKey || config.supabaseAnonKey === 'your_anon_key_here') {
            return res.status(500).json({
                error: 'Supabase anon key not configured',
                message: 'Please set SUPABASE_ANON_KEY in your .env file',
                instructions: 'Get your anon key from: https://supabase.com/dashboard/project/sfsswfzgrdctiyukhczj/settings/api'
            });
        }
        
        res.json(config);
        
    } catch (error) {
        console.error('Config endpoint error:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🔧 Supabase config server running on http://localhost:${PORT}`);
        console.log(`📡 Config endpoint: http://localhost:${PORT}/api/config`);
        
        // Check if environment is configured
        if (!process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY === 'your_anon_key_here') {
            console.log('');
            console.log('⚠️  CONFIGURATION REQUIRED:');
            console.log('   Please add your Supabase anon key to .env file');
            console.log('   Get it from: https://supabase.com/dashboard/project/sfsswfzgrdctiyukhczj/settings/api');
        }
    });
}

module.exports = app;