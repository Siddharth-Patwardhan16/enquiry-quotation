// Supabase configuration
export const SUPABASE_URL="https://yqyzntclnkxtpatbnxrv.supabase.co"
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeXpudGNsbmt4dHBhdGJueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzM5OTAsImV4cCI6MjA4MDg0OTk5MH0.lA7_G4fxyVM1lhnOd65FkaOKlE1rgrQ2WjAcY4nmREc'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

