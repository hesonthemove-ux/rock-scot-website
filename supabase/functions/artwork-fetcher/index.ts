import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Fetch stories with no artwork yet, newest first, batch of 50
  const { data: stories, error } = await supabase
    .from('wire_news')
    .select('id, title, genre')
    .is('artwork_url', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  if (!stories || stories.length === 0) return new Response('No stories need artwork', { status: 200 })

  let updated = 0

  for (const story of stories) {
    // Extract artist name from headline — stop before action verbs
  const raw = (story.title || '').replace(/^new single\s*[:–—]\s*/i, '').replace(/^new album\s*[:–—]\s*/i, '');
  const stopWords = /(share|shares|release|releases|announce|announces|perform|performs|celebrate|celebrates|reveal|reveals|confirm|confirms|drop|drops|cover|covers|launch|launches|sign|signs|return|returns|team|teams|join|joins|talk|talks|discuss|says|said|to |will |has |have |are |is )/i;
  const stopMatch = raw.search(stopWords);
  const term = (stopMatch > 3 ? raw.slice(0, stopMatch) : raw.split(/[-–—|:,]/)[0]).trim().slice(0, 60)
    let artUrl: string | null = null

    // 1. iTunes
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`)
      const d = await r.json()
      if (d.results?.[0]?.artworkUrl100) {
        artUrl = d.results[0].artworkUrl100.replace('100x100bb', '600x600bb')
      }
    } catch(_) {}

    // 2. MusicBrainz + Cover Art Archive
    if (!artUrl) {
      try {
        const r = await fetch(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(term)}&limit=1&fmt=json`, {
          headers: { 'User-Agent': 'ROCKSCOT/1.0 (studio@rock.scot)' }
        })
        const d = await r.json()
        if (d.releases?.[0]?.id) {
          const ca = await fetch(`https://coverartarchive.org/release/${d.releases[0].id}/front-250`)
          if (ca.ok) artUrl = ca.url
        }
      } catch(_) {}
    }

    // 3. Genre photo fallback pool
    if (!artUrl) {
      const GENRE_PHOTOS: Record<string, string[]> = {
        rock:    ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80','https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80'],
        metal:   ['https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&q=80','https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=600&q=80','https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&q=80'],
        punk:    ['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80','https://images.unsplash.com/photo-1501386761578-eaa54b915bce?w=600&q=80'],
        indie:   ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80','https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80'],
        alt:     ['https://images.unsplash.com/photo-1468164016595-6108e4c60753?w=600&q=80','https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80'],
        classic: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80','https://images.unsplash.com/photo-1571935441834-df3ae5b61b8b?w=600&q=80'],
      }
      const g = (story.genre || '').toLowerCase()
      const pool = Object.entries(GENRE_PHOTOS).find(([k]) => g.includes(k))?.[1] || GENRE_PHOTOS.rock
      const seed = story.id.charCodeAt(0) + story.id.charCodeAt(1)
      artUrl = pool[seed % pool.length]
    }

    // Write back to Supabase
    await supabase.from('wire_news').update({ artwork_url: artUrl }).eq('id', story.id)
    updated++

    // Small delay to respect API rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  return new Response(JSON.stringify({ processed: stories.length, updated }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
