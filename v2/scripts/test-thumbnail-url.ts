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

async function testThumbnailUrls() {
  // Get a sample exercise
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .limit(3)

  if (!exercises) {
    console.log('No exercises found')
    return
  }

  console.log('Testing thumbnail URL construction...\n')

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      const thumbnailPath = ex.thumbnail_path || 'null'
      
      // Simulate what the app code does
      const cleanPath = thumbnailPath.startsWith('exercise-videos/')
        ? thumbnailPath
        : `exercise-videos/${thumbnailPath}`
      
      const constructedUrl = `${supabaseUrl}/storage/v1/object/public/exercise-videos/${cleanPath}`
      
      console.log(`\n${ex.name}:`)
      console.log(`  Database path: ${thumbnailPath}`)
      console.log(`  cleanPath: ${cleanPath}`)
      console.log(`  Constructed URL: ${constructedUrl}`)
      
      // Check if file exists at the expected location
      const expectedStoragePath = `${slug}/thumbnail.jpg`
      try {
        const { data: files } = await supabase.storage
          .from('exercise-videos')
          .list(slug, { limit: 1 })
        
        if (files && files.some(f => f.name === 'thumbnail.jpg')) {
          console.log(`  ✅ File exists at: exercise-videos/${expectedStoragePath}`)
          
          // Try to get the public URL
          const { data: urlData } = supabase.storage
            .from('exercise-videos')
            .getPublicUrl(expectedStoragePath)
          
          console.log(`  📎 Correct public URL: ${urlData.publicUrl}`)
          console.log(`  🔍 Does constructed URL match? ${constructedUrl === urlData.publicUrl ? '✅ YES' : '❌ NO'}`)
        } else {
          console.log(`  ❌ File NOT found at: exercise-videos/${expectedStoragePath}`)
        }
      } catch (err: any) {
        console.log(`  ⚠️  Error checking: ${err.message}`)
      }
    }
  }
}

testThumbnailUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

