import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hxqhwmvwbptvfqznrhku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cWh3bXZ3YnB0dmZxem5yaGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTUwODAsImV4cCI6MjA5MjQzMTA4MH0.u03mljNtVsrwD5D-fXtQazBr5CNNo9K-wYsHtLZs7R0'
)
