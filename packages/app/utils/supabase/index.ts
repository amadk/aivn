import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { mmkvStorage } from 'app/utils/mmkv-storage'

const SUPABASE_CLIENT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_CLIENT_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SUPABASE_SERVER_URL = process.env.SUPABASE_URL
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SERVICE_KEY

const SUPABASE_URL = SUPABASE_SERVER_URL || SUPABASE_CLIENT_URL
const SUPABASE_KEY = SUPABASE_SERVER_KEY || SUPABASE_CLIENT_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: mmkvStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default supabase
