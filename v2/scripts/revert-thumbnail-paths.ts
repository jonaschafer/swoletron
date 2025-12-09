import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function revertThumbnailPaths() {
  // Get all exercises with Programme.app URLs that have thumbnail paths without youtube/ prefix
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .not('thumbnail_path', 'is', null)
    .order('name')

  if (!exercises) {
    console.error('❌ Failed to fetch exercises')
    return
  }

  // Filter to only those that don't start with youtube/ or exercise-videos/
  const toRevert = exercises.filter(ex => {
    const path = ex.thumbnail_path || ''
    return path && !path.startsWith('youtube/') && !path.startsWith('exercise-videos/')
  })

  console.log(`🔄 Reverting ${toRevert.length} thumbnail paths back to youtube/ format...\n`)

  let successCount = 0
  let errorCount = 0

  for (const ex of toRevert) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      // Revert to: youtube/{slug}/thumbnail.jpg
      const newPath = `youtube/${slug}/thumbnail.jpg`
      
      const { error } = await supabase
        .from('exercise_library')
        .update({ thumbnail_path: newPath })
        .eq('id', ex.id)

      if (error) {
        console.error(`❌ Error updating "${ex.name}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ ${ex.name}`)
        console.log(`   ${ex.thumbnail_path} → ${newPath}`)
        successCount++
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully reverted: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${toRevert.length}`)
}

revertThumbnailPaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

