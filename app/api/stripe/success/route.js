import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.redirect(new URL('/?onboarding=true', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', userId)
    .single()

  // Always send to onboarding form so new user can complete their profile
  return Response.redirect(new URL('/?onboarding=true', req.url))
}