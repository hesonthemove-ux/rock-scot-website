/**
 * THE WIRE — RSS fetcher for Scottish rock / music news
 * Call this on a schedule (e.g. every 15–30 min) to populate wire_news.
 * Supabase Dashboard → Edge Functions → fetch_wire_rss → Invoke,
 * or use cron-job.org to POST to the function URL.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Parser from 'https://esm.sh/rss-parser@3.13.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// All 35 Scotland music feeds + UK rock/indie. Each feed in its own try/catch — if one fails we continue.
const FEEDS: { url: string; sourceName: string; genre: 'Rock' | 'Metal' | 'Punk' | 'Indie' | 'Alternative' }[] = [
  { url: 'https://snackmag.co.uk/category/music/feed', sourceName: 'SNACK Music', genre: 'Indie' },
  { url: 'https://podcart.co/feed', sourceName: 'Podcart', genre: 'Indie' },
  { url: 'https://anrfactory.com/category/location/glasgow/feed', sourceName: 'A&R Factory Glasgow', genre: 'Rock' },
  { url: 'https://thenational.scot/culture/music/feed', sourceName: 'The National Music', genre: 'Indie' },
  { url: 'https://glasgowtimes.co.uk/entertainment/music/feed', sourceName: 'Glasgow Times Music', genre: 'Indie' },
  { url: 'https://discoverymusicscotland.com/feed', sourceName: 'Discovery Music Scotland', genre: 'Rock' },
  { url: 'https://figurenotes.org/feed', sourceName: 'Figurenotes', genre: 'Indie' },
  { url: 'https://edinburghmusicreview.com/blog/feed', sourceName: 'Edinburgh Music Review Blog', genre: 'Indie' },
  { url: 'https://isthismusic.com/feed', sourceName: 'Is This Music', genre: 'Indie' },
  { url: 'https://lovemusiclovelife.com/feed', sourceName: 'Love Music Love Life', genre: 'Indie' },
  { url: 'https://re-sound.co.uk/feed', sourceName: 'reSOUND Online', genre: 'Rock' },
  { url: 'https://jockrock.org/feed', sourceName: 'Jockrock', genre: 'Indie' },
  { url: 'https://projects.handsupfortrad.scot/feed', sourceName: 'Hands Up for Trad', genre: 'Indie' },
  { url: 'https://handsupfortrad.scot/feed', sourceName: 'Hands Up for Trad (main)', genre: 'Indie' },
  { url: 'https://bonniescotlandpresents.co.uk/feed', sourceName: 'Bonnie Scotland Presents', genre: 'Indie' },
  { url: 'https://edinburghmusicreview.com/feed', sourceName: 'Edinburgh Music Review', genre: 'Indie' },
  { url: 'https://soundyngs.wp.st-andrews.ac.uk/feed', sourceName: 'Soundyngs', genre: 'Indie' },
  { url: 'https://rickyross.com/?feed=rss2', sourceName: 'Ricky Ross Blog', genre: 'Rock' },
  { url: 'https://officialsama.com/news-blog/feed', sourceName: 'SAMA News Blog', genre: 'Alternative' },
  { url: 'https://officialsama.com/feed', sourceName: 'Scottish Alternative Music Awards', genre: 'Alternative' },
  { url: 'https://everythingflowsglasgow.blogspot.com/feeds/posts/default?alt=rss', sourceName: 'Everything Flows', genre: 'Indie' },
  { url: 'https://scottishfield.co.uk/category/music/feed', sourceName: 'Scottish Field Music', genre: 'Indie' },
  { url: 'https://somethingsomethingmusicreviews.wordpress.com/feed', sourceName: 'Something something Music Reviews', genre: 'Indie' },
  { url: 'https://edinburghmusiclovers.com/blog/feed', sourceName: 'Edinburgh Music Lovers', genre: 'Indie' },
  { url: 'https://musicnewsscotland.com/feed', sourceName: 'MUSIC NEWS Scotland', genre: 'Rock' },
  { url: 'https://drakemusicscotland.org/news/feed', sourceName: 'Drake Music Scotland', genre: 'Indie' },
  { url: 'https://traditionalmusicforum.org/feed', sourceName: 'Traditional Music Forum', genre: 'Indie' },
  { url: 'https://musiccollectivescotland.com/feed', sourceName: 'Music Collective Scotland', genre: 'Indie' },
  { url: 'https://gigsinscotland.com/feed', sourceName: 'Gigs in Scotland', genre: 'Rock' },
  { url: 'https://gigsinscotland.com/news/feed', sourceName: 'Gigs in Scotland News', genre: 'Rock' },
  { url: 'https://edinburghmagazine.com/feed', sourceName: 'Edinburgh Magazine Music', genre: 'Indie' },
  { url: 'https://theskinny.co.uk/music/feed', sourceName: 'The Skinny Music', genre: 'Indie' },
  { url: 'https://officialsama.com/new-music-1/feed', sourceName: 'SAMA New Music', genre: 'Alternative' },
  { url: 'https://scottishmusicnetwork.co.uk/feed', sourceName: 'Scottish Music Network', genre: 'Indie' },
  { url: 'https://folkandhoney.co.uk/scotland/feed', sourceName: 'Folk and Honey Scotland', genre: 'Indie' },
  { url: 'https://musicforscotland.co.uk/blog/feed', sourceName: 'Music For Scotland', genre: 'Indie' },
  { url: 'https://glasgowmusiccitytours.com/blog/feed', sourceName: 'Glasgow Music City Tours', genre: 'Indie' },
  { url: 'https://newmusicscotland.co.uk/articles/feed', sourceName: 'New Music Scotland', genre: 'Indie' },
  // UK / international fallback
  { url: 'https://www.loudersound.com/feed', sourceName: 'Loudersound', genre: 'Rock' },
  { url: 'https://www.nme.com/feed', sourceName: 'NME', genre: 'Rock' },
  { url: 'https://www.theguardian.com/music/rock/rss', sourceName: 'The Guardian Music', genre: 'Rock' },
  { url: 'https://diymag.com/feed', sourceName: 'DIY', genre: 'Indie' },
]

const parser = new Parser({ timeout: 8000 })
const FETCH_TIMEOUT_MS = 8000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  // Allow GET so cron can trigger with a simple URL fetch
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
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
        const res = await fetch(feed.url, { signal: controller.signal })
        clearTimeout(timeoutId)
        const xml = await res.text()
        const parsed = await parser.parseString(xml)
        const items = (parsed.items ?? []).slice(0, 10)

        for (const item of items) {
          const title = (item.title ?? '').trim()
          const link = (item.link ?? item.guid ?? `rss-${feed.sourceName}-${Date.now()}-${inserted}`).trim()
          if (!title) continue

          const sourceUrl = link.startsWith('http') ? link : `rss-${feed.sourceName}-${inserted}-${Date.now()}`
          const { error } = await supabase
            .from('wire_news')
            .upsert(
              {
                title: title.slice(0, 500),
                summary: (item.contentSnippet ?? item.content ?? '').slice(0, 1000) || null,
                source_url: sourceUrl,
                source_name: feed.sourceName,
                genre: feed.genre,
                is_live: true,
              },
              { onConflict: 'source_url', ignoreDuplicates: true }
            )

          if (!error) inserted++
        }
      } catch (e) {
        errors.push(`${feed.sourceName}: ${(e as Error).message}`)
        // Continue to next feed — one failure must not stop the rest
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        errors: errors.length ? errors : undefined,
        message: `Inserted ${inserted} items into wire_news.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
