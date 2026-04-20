import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://bfmokqzvdowafymjbtgq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbW9rcXp2ZG93YWZ5bWpidGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDExMzksImV4cCI6MjA5MjA3NzEzOX0.5YayjLlVzjr0xEuRGLUrqd86jFwy2P61J87qcP4ieVU'
)
