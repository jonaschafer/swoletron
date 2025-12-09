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

async function fixThumbnailPaths() {
  // Get all exercises with Programme.app URLs
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .order('name')

  if (!exercises) {
    console.error('❌ Failed to fetch exercises')
    return
  }

  console.log(`🔄 Fixing thumbnail paths for ${exercises.length} exercises...\n`)

  let successCount = 0
  let errorCount = 0
  const updates: Array<{ name: string; oldPath: string | null; newPath: string }> = []

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      const expectedThumbnail = `youtube/${slug}/thumbnail.jpg`
      
      // Only update if the path is different
      if (ex.thumbnail_path !== expectedThumbnail) {
        const { error } = await supabase
          .from('exercise_library')
          .update({ thumbnail_path: expectedThumbnail })
          .eq('id', ex.id)

        if (error) {
          console.error(`❌ Error updating "${ex.name}":`, error.message)
          errorCount++
        } else {
          console.log(`✅ ${ex.name}`)
          console.log(`   ${ex.thumbnail_path || 'null'} → ${expectedThumbnail}`)
          updates.push({
            name: ex.name,
            oldPath: ex.thumbnail_path,
            newPath: expectedThumbnail
          })
          successCount++
        }
      } else {
        console.log(`✓ ${ex.name} (already correct)`)
      }
    } else {
      console.warn(`⚠️  Could not extract slug from URL: ${url}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${exercises.length}`)
  
  if (successCount > 0) {
    console.log('\n💡 Note: The thumbnail files themselves may need to be downloaded/uploaded.')
    console.log('   The paths are now correct, but you may need to run the download script')
    console.log('   to fetch the actual thumbnail images from Programme.app')
  }
}

fixThumbnailPaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

