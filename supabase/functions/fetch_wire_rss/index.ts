/**
 * THE WIRE — RSS fetcher for Scottish rock / music news
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS: { url: string; sourceName: string; genre: string }[] = [
  { url: 'https://www.loudersound.com/feed', sourceName: 'Loudersound', genre: 'Rock' },
  { url: 'https://www.nme.com/feed', sourceName: 'NME', genre: 'Rock' },
  { url: 'https://www.theguardian.com/music/rock/rss', sourceName: 'The Guardian', genre: 'Rock' },
  { url: 'https://diymag.com/feed', sourceName: 'DIY', genre: 'Indie' },
]

const parser = new Parser({ timeout: 10000 })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    let inserted = 0
    const errors: string[] = []
    for (const feed of FEEDS) {
      try {
        const xml = await fetch(feed.url).then(r => r.text())
        const parsed = await parser.parseString(xml)
        const items = (parsed.items ?? []).slice(0, 10)
        for (const item of items) {
          const title = (item.title ?? '').trim()
          const link = (item.link ?? item.guid ?? '').trim()
          if (!title) continue
          const sourceUrl = link.startsWith('http') ? link : 'rss-' + feed.sourceName + '-' + Date.now() + '-' + inserted
          const { error } = await supabase.from('wire_news').upsert({
            title: title.slice(0, 500),
            summary: (item.contentSnippet ?? item.content ?? '').slice(0, 1000) || null,
            source_url: sourceUrl,
            source_name: feed.sourceName,
            genre: feed.genre,
            is_live: true,
          }, { onConflict: 'source_url', ignoreDuplicates: true })
          if (!error) inserted++
        }
      } catch (e) {
        errors.push(feed.sourceName + ': ' + (e as Error).message)
      }
    }
    return new Response(JSON.stringify({ ok: true, inserted, errors: errors.length ? errors : undefined }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
