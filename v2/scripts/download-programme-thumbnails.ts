import 'dotenv/config'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    fs.writeFileSync(outputPath, response.data)
    return true
  } catch (error: any) {
    console.error(`    ❌ Download failed: ${error.message}`)
    return false
  }
}

async function generateVideoThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
  try {
    // Use ffmpeg to extract a frame at 1 second
    execSync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}" -y`, {
      stdio: 'ignore'
    })
    return fs.existsSync(thumbnailPath)
  } catch (error) {
    return false
  }
}

async function scrapeProgramme(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🌐 Scraping: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    })

    const html = response.data as string
    
    // Look for video first (preferred)
    const videoPatterns = [
      /<video[^>]+src="([^"]+)"/i,
      /<source[^>]+src="([^"]+)"/i,
      /https:\/\/p001\.nyc3\.digitaloceanspaces\.com\/movements\/[^"'\s]+\.mp4/gi,
    ]

    for (const pattern of videoPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        let videoUrl = match[1]
        if (videoUrl.startsWith('/')) {
          videoUrl = `https://programme.app${videoUrl}`
        }
        if (videoUrl.startsWith('http') && videoUrl.includes('.mp4')) {
          console.log(`    🎥 Found video: ${videoUrl}`)
          // Download video to temp location
          const tempVideo = outputPath.replace('.jpg', '.mp4')
          const downloaded = await downloadFile(videoUrl, tempVideo)
          if (downloaded) {
            // Generate thumbnail from video
            console.log(`    🖼️  Generating thumbnail from video...`)
            const thumbnailGenerated = await generateVideoThumbnail(tempVideo, outputPath)
            // Clean up temp video
            try {
              fs.unlinkSync(tempVideo)
            } catch {}
            if (thumbnailGenerated) {
              console.log(`    ✅ Thumbnail generated`)
              return true
            }
          }
        }
      }
    }

    // Fallback to image
    const imagePatterns = [
      /<img[^>]+src="([^"]+\.(jpg|png|webp|jpeg))"[^>]*>/i,
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    ]

    for (const pattern of imagePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        let imageUrl = match[1]
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://programme.app${imageUrl}`
        }
        if (imageUrl.startsWith('http') && (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.webp'))) {
          console.log(`    🖼️  Found image: ${imageUrl}`)
          return await downloadFile(imageUrl, outputPath)
        }
      }
    }

    console.log(`    ⚠️  No video or image found`)
    return false
  } catch (error: any) {
    console.error(`    ❌ Error: ${error.message}`)
    return false
  }
}

async function uploadToSupabase(filePath: string, storagePath: string, contentType: string): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`    ❌ File does not exist: ${filePath}`)
      return false
    }

    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
      console.error(`    ❌ File is empty: ${filePath}`)
      return false
    }

    const fileContent = fs.readFileSync(filePath)
    
    // storagePath is already just the path within the bucket (e.g., "{slug}/thumbnail.jpg")
    // Upload to exercise-videos bucket
    console.log(`    📦 Uploading to exercise-videos bucket, path: ${storagePath}`)
    
    const { error } = await supabase.storage
      .from('exercise-videos')
      .upload(storagePath, fileContent, {
        contentType,
        upsert: true
      })

    if (error) {
      console.error(`    ❌ Upload failed: ${error.message}`)
      return false
    }

    console.log(`    ✅ Uploaded successfully`)
    return true
  } catch (error: any) {
    console.error(`    ❌ Upload error: ${error.message}`)
    return false
  }
}

async function downloadProgrammeThumbnails() {
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

  console.log(`🔄 Downloading thumbnails for ${exercises.length} exercises...\n`)

  const tempDir = path.join(os.tmpdir(), 'programme-thumbnails')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  let successCount = 0
  let errorCount = 0

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (!match) {
      console.log(`⚠️  Skipping ${ex.name}: Invalid URL format`)
      errorCount++
      continue
    }

    const slug = match[1]
    // Database path format: youtube/{slug}/thumbnail.jpg
    // Actual storage: exercise-videos/{slug}/thumbnail.jpg (no youtube/ prefix)
    const thumbnailPath = `youtube/${slug}/thumbnail.jpg` // Database path
    const storagePath = `${slug}/thumbnail.jpg` // Actual storage path (no bucket prefix)
    
    // Check if thumbnail already exists in storage
    let hasThumbnail = false
    try {
      const { data: existing } = await supabase.storage
        .from('exercise-videos')
        .list(storagePath.split('/')[0], { limit: 1 })
      hasThumbnail = existing && existing.some(f => f.name === 'thumbnail.jpg')
    } catch {
      // Bucket might not exist or folder doesn't exist, continue
    }
    
    if (hasThumbnail) {
      console.log(`✓ ${ex.name} (thumbnail already exists)`)
      continue
    }

    console.log(`\n📥 ${ex.name}`)
    console.log(`   URL: ${url}`)
    console.log(`   Thumbnail path: ${thumbnailPath}`)

    const tempThumbnail = path.join(tempDir, `${slug}-thumbnail.jpg`)

    // Download thumbnail
    const downloaded = await scrapeProgramme(url, tempThumbnail)
    
    if (!downloaded) {
      console.log(`   ❌ Failed to download thumbnail`)
      errorCount++
      continue
    }

    // Upload to Supabase
    console.log(`   📤 Uploading to Supabase...`)
    const uploaded = await uploadToSupabase(tempThumbnail, storagePath, 'image/jpeg')
    
    if (!uploaded) {
      console.log(`   ❌ Failed to upload`)
      errorCount++
      continue
    }

    // Clean up temp file
    try {
      fs.unlinkSync(tempThumbnail)
    } catch {}

    console.log(`   ✅ Success!`)
    successCount++
  }

  // Clean up temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
  } catch {}

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully downloaded: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${exercises.length}`)
}

downloadProgrammeThumbnails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

