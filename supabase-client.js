// Supabase Client Configuration for Steel Onboarding App
// Dynamically loads configuration from server or uses fallback

// Global variables for Supabase client
let supabase = null;
let supabaseConfig = null;

// Initialize Supabase client asynchronously
async function initializeSupabase() {
  try {
    console.log('[Supabase] Loading configuration...');
    
    // Fallback configuration (working anon key)
    supabaseConfig = {
      supabaseUrl: 'https://sfsswfzgrdctiyukhczj.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3N3ZnpncmRjdGl5dWtoY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0OTkzNjksImV4cCI6MjA0MTA3NTM2OX0.iF5WC-iUMN-3t4fOG5PVLxzQtSqpfHKZnr5B9gOJxKs'
    };
    
    // Create Supabase client
    supabase = window.supabase.createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    
    console.log('[Supabase] Client initialized successfully');
    return supabase;
    
  } catch (error) {
    console.error('[Supabase] Failed to initialize:', error.message);
    throw error;
  }
}

// Auth helper functions
const authHelpers = {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          position: userData.position,
          start_date: userData.startDate
        }
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in existing user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser()
  },

  // Get current session
  getCurrentSession() {
    return supabase.auth.getSession()
  },

  // Listen for auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers for user profiles
const profileHelpers = {
  // Create user profile after signup
  async createProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: userId,
        name: profileData.name,
        email: profileData.email,
        position: profileData.position,
        start_date: profileData.startDate,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get onboarding progress
  async getOnboardingProgress(userId) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    return data || []
  },

  // Save onboarding progress
  async saveProgress(userId, moduleData) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert([{
        user_id: userId,
        module_name: moduleData.moduleName,
        progress_data: JSON.stringify(moduleData),
        completed_at: new Date().toISOString()
      }], {
        onConflict: 'user_id,module_name'
      })
      .select()
    
    if (error) throw error
    return data
  }
}

// Initialize and make available globally
initializeSupabase().then((client) => {
  window.supabase = client;
  window.authHelpers = authHelpers;
  window.profileHelpers = profileHelpers;
  window.supabaseConfig = supabaseConfig;
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('supabaseReady', {
    detail: { supabase: client, config: supabaseConfig }
  }));
  
  console.log('[Supabase] Ready for authentication');
}).catch((error) => {
  console.error('[Supabase] Initialization failed:', error);
  
  // Dispatch error event
  window.dispatchEvent(new CustomEvent('supabaseError', {
    detail: { error: error.message }
  }));
});