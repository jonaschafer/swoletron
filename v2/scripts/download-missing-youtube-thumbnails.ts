import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { createWriteStream } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

interface ExerciseMapping {
  name: string
  url: string
  sourceType: 'vissco' | 'prehab' | 'programme' | 'anytimefitness'
}

const exerciseMappings: ExerciseMapping[] = [
  { name: 'Ankle Alphabet', url: 'https://www.vissco.com/physiotherapy-exercise/making-alphabets-with-foot-on-chair/', sourceType: 'vissco' },
  { name: 'Ankle Circles', url: 'https://www.vissco.com/physiotherapy-exercise/making-alphabets-with-foot-on-chair/', sourceType: 'vissco' },
  { name: 'Bosu Balance', url: 'https://library.theprehabguys.com/vimeo-video/single-leg-balance-bosu-blue-side-up-2/', sourceType: 'prehab' },
  { name: 'Box Step-Ups', url: 'https://programme.app/exercises/db-suitcase-step-up/259', sourceType: 'programme' },
  { name: 'Fire Hydrants', url: 'https://programme.app/exercises/banded-fire-hydrant/77', sourceType: 'programme' },
  { name: 'Reverse Lunges', url: 'https://programme.app/exercises/db-goblet-reverse-lunge/235', sourceType: 'programme' },
  { name: 'Single-Leg Glute Bridges', url: 'https://programme.app/exercises/single-leg-glute-bridge-hold/871', sourceType: 'programme' },
  { name: 'Single-Leg RDL', url: 'https://www.anytimefitness.com/blog/single-leg-romanian-deadlift', sourceType: 'anytimefitness' },
  { name: 'Step-Downs', url: 'https://programme.app/exercises/single-leg-step-down/892', sourceType: 'programme' },
  { name: 'Face Pulls', url: 'https://programme.app/exercises/banded-facepulls/76', sourceType: 'programme' },
  { name: 'Kettlebell Wood Chopper', url: 'https://programme.app/exercises/half-kneeling-kb-cross-chops/391', sourceType: 'programme' },
  { name: 'Flutter Kicks', url: 'https://programme.app/exercises/hollow-body-flutters/450', sourceType: 'programme' },
  { name: 'Dead Hang', url: 'https://programme.app/exercises/active-hang/19', sourceType: 'programme' },
  { name: 'Band Pull Apart', url: 'https://programme.app/exercises/banded-pull-aparts/87', sourceType: 'programme' },
  { name: 'Bird Dogs', url: 'https://programme.app/exercises/bird-dog/134', sourceType: 'programme' },
  { name: 'Dead Bugs', url: 'https://programme.app/exercises/deadbug-hold/270', sourceType: 'programme' },
  { name: 'Glute Bridge', url: 'https://programme.app/exercises/glute-bridge-hold/361', sourceType: 'programme' },
  { name: 'Clamshells', url: 'https://programme.app/exercises/banded-clam-shell/69', sourceType: 'programme' },
  { name: 'Full Plank - Shoulder Taps', url: 'https://programme.app/exercises/opposite-shoulder-tap-with-pause/628', sourceType: 'programme' },
  { name: 'Negative Pull-Ups / Pullups', url: 'https://programme.app/exercises/eccentric-pull-up/306', sourceType: 'programme' },
  { name: 'Lateral Band Walks', url: 'https://programme.app/exercises/lateral-banded-walks/566', sourceType: 'programme' },
]

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function downloadFile(url: string, outputPath: string, timeout: number = 30000): Promise<boolean> {
  try {
    console.log(`  📥 Downloading: ${url}`)
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: (status) => status === 200
    })

    const writer = createWriteStream(outputPath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const stats = fs.statSync(outputPath)
        if (stats.size > 0) {
          console.log(`  ✅ Downloaded (${stats.size} bytes)`)
          resolve(true)
        } else {
          console.log(`  ❌ Downloaded file is empty`)
          resolve(false)
        }
      })
      writer.on('error', reject)
    })
  } catch (error: any) {
    if (error.response) {
      console.error(`  ❌ Download failed: ${error.response.status} ${error.response.statusText}`)
    } else {
      console.error(`  ❌ Download failed: ${error.message}`)
    }
    return false
  }
}

async function scrapeVissco(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🌐 Scraping Vissco page: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    })

    const html = response.data as string
    
    // Look for images, but skip logos
    const imageMatches: string[] = []
    
    // Pattern 1: img tags (global)
    const imgPattern = /<img[^>]+src="([^"]+\.(jpg|png|webp|jpeg))"[^>]*>/gi
    let match
    while ((match = imgPattern.exec(html)) !== null) {
      if (match[1]) {
        let imageUrl = match[1]
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://www.vissco.com${imageUrl}`
        }
        // Skip logos and small images
        if (!imageUrl.includes('logo') && !imageUrl.includes('Logo')) {
          imageMatches.push(imageUrl)
        }
      }
    }
    
    // Pattern 2: og:image meta tag
    const ogPattern = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i
    const ogMatch = html.match(ogPattern)
    if (ogMatch && ogMatch[1]) {
      let imageUrl = ogMatch[1]
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://www.vissco.com${imageUrl}`
      }
      if (!imageUrl.includes('logo') && !imageUrl.includes('Logo')) {
        imageMatches.push(imageUrl)
      }
    }
    
    // Pattern 3: background-image (global)
    const bgPattern = /background-image:\s*url\(['"]([^'"]+)['"]\)/gi
    while ((match = bgPattern.exec(html)) !== null) {
      if (match[1]) {
        let imageUrl = match[1]
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://www.vissco.com${imageUrl}`
        }
        if (!imageUrl.includes('logo') && !imageUrl.includes('Logo')) {
          imageMatches.push(imageUrl)
        }
      }
    }

    // Try to find the largest/most relevant image
    for (const imageUrl of imageMatches) {
      console.log(`  🖼️  Trying image: ${imageUrl}`)
      const success = await downloadFile(imageUrl, outputPath)
      if (success) {
        const stats = fs.statSync(outputPath)
        // Make sure it's a reasonable size (not a tiny logo)
        if (stats.size > 10000) {
          return true
        }
      }
    }

    console.log(`  ⚠️  No suitable image found on Vissco page`)
    return false
  } catch (error: any) {
    console.error(`  ❌ Scraping failed: ${error.message}`)
    return false
  }
}

async function scrapePrehab(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🌐 Scraping Prehab page: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    })

    const html = response.data as string
    
    // Look for Vimeo video first
    const vimeoPattern = /<iframe[^>]+src="([^"]*vimeo[^"]+)"/i
    const vimeoMatch = html.match(vimeoPattern)
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoUrl = vimeoMatch[1]
      const vimeoIdMatch = vimeoUrl.match(/vimeo\.com\/(\d+)/)
      if (vimeoIdMatch && vimeoIdMatch[1]) {
        const vimeoId = vimeoIdMatch[1]
        // Try multiple Vimeo thumbnail services
        const thumbnailUrls = [
          `https://vumbnail.com/${vimeoId}.jpg`,
          `https://i.vimeocdn.com/video/${vimeoId}_640.jpg`,
          `https://vumbnail.com/${vimeoId}.jpg?size=large`,
        ]
        
        for (const thumbnailUrl of thumbnailUrls) {
          console.log(`  🖼️  Trying Vimeo thumbnail: ${thumbnailUrl}`)
          const success = await downloadFile(thumbnailUrl, outputPath)
          if (success) {
            const stats = fs.statSync(outputPath)
            if (stats.size > 10000) {
              return true
            }
          }
        }
      }
    }
    
    // Fallback to images, but skip logos
    const imageMatches: string[] = []
    
    // Pattern 1: img tags (global)
    const imgPattern = /<img[^>]+src="([^"]+\.(jpg|png|webp|jpeg))"[^>]*>/gi
    let match
    while ((match = imgPattern.exec(html)) !== null) {
      if (match[1]) {
        let imageUrl = match[1]
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://library.theprehabguys.com${imageUrl}`
        }
        // Skip logos and small images
        if (!imageUrl.includes('logo') && !imageUrl.includes('Logo') && !imageUrl.includes('top-prehab')) {
          imageMatches.push(imageUrl)
        }
      }
    }
    
    // Pattern 2: og:image meta tag
    const ogPattern = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i
    const ogMatch = html.match(ogPattern)
    if (ogMatch && ogMatch[1]) {
      let imageUrl = ogMatch[1]
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://library.theprehabguys.com${imageUrl}`
      }
      if (!imageUrl.includes('logo') && !imageUrl.includes('Logo') && !imageUrl.includes('top-prehab')) {
        imageMatches.push(imageUrl)
      }
    }

    for (const imageUrl of imageMatches) {
      console.log(`  🖼️  Trying image: ${imageUrl}`)
      const success = await downloadFile(imageUrl, outputPath)
      if (success) {
        const stats = fs.statSync(outputPath)
        if (stats.size > 10000) {
          return true
        }
      }
    }

    console.log(`  ⚠️  No suitable media found on Prehab page`)
    return false
  } catch (error: any) {
    console.error(`  ❌ Scraping failed: ${error.message}`)
    return false
  }
}

async function generateVideoThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
  try {
    console.log(`  🎬 Generating thumbnail from video...`)
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailPath}"`
    console.log(`  📝 Command: ${command}`)
    await execAsync(command)
    console.log(`  ✅ Thumbnail generated`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Thumbnail generation failed: ${error.message}`)
    return false
  }
}

async function scrapeProgramme(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🌐 Scraping Programme.app page: ${url}`)
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
          console.log(`  🎥 Found video: ${videoUrl}`)
          // Download video to temp location
          const tempVideo = outputPath.replace('.jpg', '.mp4')
          const downloaded = await downloadFile(videoUrl, tempVideo)
          if (downloaded) {
            // Generate thumbnail from video
            const thumbnailGenerated = await generateVideoThumbnail(tempVideo, outputPath)
            // Clean up temp video
            try {
              fs.unlinkSync(tempVideo)
            } catch {}
            return thumbnailGenerated
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
        if (imageUrl.startsWith('http')) {
          console.log(`  🖼️  Found image: ${imageUrl}`)
          return await downloadFile(imageUrl, outputPath)
        }
      }
    }

    console.log(`  ⚠️  No media found on Programme.app page`)
    return false
  } catch (error: any) {
    console.error(`  ❌ Scraping failed: ${error.message}`)
    return false
  }
}

async function scrapeAnytimeFitness(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🌐 Scraping Anytime Fitness page: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    })

    const html = response.data as string
    
    // Look for image
    const patterns = [
      /<img[^>]+src="([^"]+\.(jpg|png|webp|jpeg))"[^>]*>/i,
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /background-image:\s*url\(['"]([^'"]+)['"]\)/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        let imageUrl = match[1]
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://www.anytimefitness.com${imageUrl}`
        }
        if (imageUrl.startsWith('http')) {
          console.log(`  🖼️  Found image: ${imageUrl}`)
          return await downloadFile(imageUrl, outputPath)
        }
      }
    }

    console.log(`  ⚠️  No image found on Anytime Fitness page`)
    return false
  } catch (error: any) {
    console.error(`  ❌ Scraping failed: ${error.message}`)
    return false
  }
}

async function uploadToSupabase(
  filePath: string,
  storagePath: string,
  contentType: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File does not exist: ${filePath}`)
      return false
    }

    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
      console.error(`  ❌ File is empty: ${filePath}`)
      return false
    }

    console.log(`  📤 Uploading to: ${storagePath} (${stats.size} bytes)`)
    const fileBuffer = fs.readFileSync(filePath)
    
    const { error } = await supabase.storage
      .from('exercise-videos')
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      })
    
    if (error) {
      console.error(`  ❌ Upload failed: ${error.message}`)
      return false
    }
    
    console.log(`  ✅ Uploaded: ${storagePath}`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Upload error: ${error.message}`)
    return false
  }
}

async function updateDatabase(
  exerciseName: string,
  thumbnailPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exercise_library')
      .update({ thumbnail_path: thumbnailPath })
      .eq('name', exerciseName)
    
    if (error) {
      console.error(`  ❌ Database update failed: ${error.message}`)
      return false
    }
    
    console.log(`  ✅ Database updated`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Database error: ${error.message}`)
    return false
  }
}

async function processExercises() {
  console.log('🚀 Downloading missing YouTube thumbnails from alternative sources...\n')
  console.log(`📋 Processing ${exerciseMappings.length} exercises\n`)
  console.log('='.repeat(60))

  const tempDir = path.join(os.tmpdir(), 'missing-thumbnails-downloads')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const results: Array<{ exercise: ExerciseMapping; success: boolean; error?: string }> = []

  for (let i = 0; i < exerciseMappings.length; i++) {
    const exercise = exerciseMappings[i]
    console.log(`\n[${i + 1}/${exerciseMappings.length}] ${exercise.name}`)
    console.log(`URL: ${exercise.url}`)
    console.log(`Source: ${exercise.sourceType}`)
    console.log('-'.repeat(60))

    try {
      const slug = createSlug(exercise.name)
      const tempThumbnail = path.join(tempDir, `${slug}-thumbnail.jpg`)
      const storagePath = `exercise-videos/youtube/${slug}/thumbnail.jpg`

      let downloaded = false

      switch (exercise.sourceType) {
        case 'vissco':
          downloaded = await scrapeVissco(exercise.url, tempThumbnail)
          break
        case 'prehab':
          downloaded = await scrapePrehab(exercise.url, tempThumbnail)
          break
        case 'programme':
          downloaded = await scrapeProgramme(exercise.url, tempThumbnail)
          break
        case 'anytimefitness':
          downloaded = await scrapeAnytimeFitness(exercise.url, tempThumbnail)
          break
      }

      if (!downloaded) {
        results.push({ exercise, success: false, error: 'Download failed' })
        continue
      }

      const uploaded = await uploadToSupabase(tempThumbnail, storagePath, 'image/jpeg')
      if (!uploaded) {
        results.push({ exercise, success: false, error: 'Upload failed' })
        continue
      }

      const dbUpdated = await updateDatabase(exercise.name, `youtube/${slug}/thumbnail.jpg`)
      if (!dbUpdated) {
        results.push({ exercise, success: false, error: 'Database update failed' })
        continue
      }

      results.push({ exercise, success: true })
    } catch (error: any) {
      console.error(`  ❌ Unexpected error: ${error.message}`)
      results.push({ exercise, success: false, error: error.message })
    }

    // Delay between exercises
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📊 SUMMARY')
  console.log(`${'='.repeat(60)}\n`)

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount

  console.log(`✅ Successful: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${failCount}/${results.length}\n`)

  if (failCount > 0) {
    console.log('Failed exercises:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.exercise.name}: ${r.error}`)
    })
  }

  // Cleanup
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
    console.log(`\n🧹 Cleaned up temp directory`)
  } catch (error) {
    // Ignore
  }

  console.log('\n✅ Done!')
}

processExercises()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

