import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_CLIENT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_CLIENT_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SUPABASE_SERVER_URL = process.env.SUPABASE_URL
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SERVICE_KEY

const supabase =
  SUPABASE_SERVER_KEY && SUPABASE_SERVER_URL
    ? createClient(SUPABASE_SERVER_URL, SUPABASE_SERVER_KEY)
    : createBrowserClient(SUPABASE_CLIENT_URL, SUPABASE_CLIENT_KEY)

export default supabase
