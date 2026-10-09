import { supabase } from '@/lib/supabase'

/**
 * Staging-only building block.
 * A Supabase anonymous user is an authenticated session, not an untrusted guest ID.
 * Do not replace production getGuestId() until the whole staging flow is migrated.
 */
export async function ensureAnonymousSession(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  if (sessionData.session) {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!data.user) throw new Error('Authenticated user not found')
    return data.user.id
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  if (!data.user || !data.session) {
    throw new Error('Anonymous authentication failed')
  }
  return data.user.id
}
