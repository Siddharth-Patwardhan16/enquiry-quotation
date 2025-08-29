// Supabase configuration
export const SUPABASE_URL = "https://oranunegpkkawmafoeem.supabase.co"
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYW51bmVncGtrYXdtYWZvZWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTYwODIsImV4cCI6MjA3MDYzMjA4Mn0.CHAAWYUJ6mqYfAYkvDKOnot3Ld3Uck8yrgChKOpfkI4'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

