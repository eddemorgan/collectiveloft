import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', userId)
    .single()

  if (profile?.firstname && profile?.lastname) {
    const slug = `${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`
    return Response.redirect(new URL(`/profile/${slug}`, req.url))
  }

  return Response.redirect(new URL('/discover', req.url))
}