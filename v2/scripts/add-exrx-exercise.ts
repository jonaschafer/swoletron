import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { load } from 'cheerio'
import puppeteer, { Browser } from 'puppeteer'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. The import script requires elevated privileges.'
  )
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

interface ExerciseData {
  name: string
  description: string | null
  bodyParts: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  injuryAreas: string[]
  demoUrl: string | null
  thumbnailUrl: string | null
  sourceUrl: string
}

async function scrapeExRx(url: string): Promise<ExerciseData> {
  console.log(`\n🔍 Scraping ExRx: ${url}`)
  
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Set user agent to appear more like a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // Wait for main content to load
    try {
      await page.waitForSelector('h1, table, .exercise', { timeout: 5000 })
    } catch (e) {
      // Continue even if selector not found
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const html = await page.content()
    const $ = load(html)

    // Extract name
    let name = ''
    $('h1').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length > 3 && 
          !text.toLowerCase().includes('verify') &&
          !text.toLowerCase().includes('human') &&
          !text.toLowerCase().includes('captcha')) {
        name = text
        return false
      }
    })
    
    if (!name || name.length < 3) {
      const titleText = $('title').text().trim()
      if (titleText && !titleText.toLowerCase().includes('verify')) {
        name = titleText.replace(/\s*-\s*ExRx\.net.*/i, '').trim()
      }
    }
    
    if (!name || name.length < 3 || name.toLowerCase().includes('exrx.net')) {
      const urlMatch = url.match(/\/([^/]+)$/)
      if (urlMatch) {
        name = urlMatch[1].replace(/([A-Z])/g, ' $1').trim()
      }
    }

    // Extract description
    let description = ''
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description && 
          !text.toLowerCase().includes('exrx') &&
          !text.toLowerCase().includes('copyright') &&
          !text.toLowerCase().includes('verify') &&
          !text.toLowerCase().includes('human') &&
          !text.toLowerCase().includes('captcha') &&
          !text.toLowerCase().includes('complete the action')) {
        description = text
      }
    })

    // Extract body parts
    const bodyParts: string[] = await page.evaluate(() => {
      const parts: string[] = []
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr')
        rows.forEach(row => {
          const th = row.querySelector('th')
          if (th) {
            const headerText = th.textContent?.trim().toLowerCase() || ''
            if (headerText.includes('muscle') || headerText.includes('target') ||
                headerText.includes('primary') || headerText.includes('secondary')) {
              const tds = row.querySelectorAll('td')
              tds.forEach(td => {
                const text = td.textContent?.trim()
                if (text) {
                  const muscles = text.split(/[,;|\n\r]+/).map(m => m.trim()).filter(m => m.length > 0)
                  muscles.forEach(muscle => {
                    if (muscle.length > 0 && muscle.length < 100 && !parts.includes(muscle)) {
                      parts.push(muscle)
                    }
                  })
                }
              })
            }
          }
        })
      })
      
      const muscleLinks = document.querySelectorAll('a[href*="/Muscles/"], a[href*="/MuscleGroups/"]')
      muscleLinks.forEach(link => {
        const text = link.textContent?.trim()
        if (text && text.length > 0 && text.length < 100 && !parts.includes(text)) {
          parts.push(text)
        }
      })
      
      // Clean up duplicates
      const cleanedParts: string[] = []
      const seen = new Set<string>()
      parts.forEach(part => {
        const cleaned = part.trim().replace(/[,;.\s]+$/, '')
        if (cleaned.length === 0 || cleaned.length >= 100) return
        const normalized = cleaned.toLowerCase()
        let isDuplicate = false
        for (const existing of cleanedParts) {
          const existingNormalized = existing.toLowerCase()
          if (normalized === existingNormalized) {
            isDuplicate = true
            break
          }
          if (normalized.includes(existingNormalized) || existingNormalized.includes(normalized)) {
            if (cleaned.length > existing.length) {
              const index = cleanedParts.indexOf(existing)
              cleanedParts[index] = cleaned
            }
            isDuplicate = true
            break
          }
        }
        if (!isDuplicate && !seen.has(normalized)) {
          cleanedParts.push(cleaned)
          seen.add(normalized)
        }
      })
      return cleanedParts
    })

    // Extract equipment
    const equipment: string[] = await page.evaluate(() => {
      const eq: string[] = []
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr')
        rows.forEach(row => {
          const th = row.querySelector('th')
          if (th) {
            const headerText = th.textContent?.trim().toLowerCase() || ''
            if (headerText.includes('equipment')) {
              const tds = row.querySelectorAll('td')
              tds.forEach(td => {
                const text = td.textContent?.trim()
                if (text) {
                  const items = text.split(/[,;|\n\r]+/).map(i => i.trim()).filter(i => i.length > 0)
                  items.forEach(item => {
                    if (item.length > 0 && item.length < 100 && !eq.includes(item)) {
                      eq.push(item)
                    }
                  })
                }
              })
            }
          }
        })
      })
      
      const equipmentLinks = document.querySelectorAll('a[href*="/Equipment/"]')
      equipmentLinks.forEach(link => {
        const text = link.textContent?.trim()
        if (text && text.length > 0 && text.length < 100 && !eq.includes(text)) {
          eq.push(text)
        }
      })
      
      // Extract from name/URL
      const h1 = document.querySelector('h1')
      const path = window.location.pathname
      if (h1) {
        const name = h1.textContent?.trim() || ''
        if (name.match(/\bDB\b/i) || name.match(/\bDumbbell\b/i) || path.includes('/DB') || path.includes('/Dumbbell')) {
          if (!eq.includes('Dumbbell') && !eq.some(e => e.toLowerCase().includes('dumbbell'))) {
            eq.push('Dumbbell')
          }
        }
        if (name.match(/\bKB\b/i) || name.match(/\bKettlebell\b/i) || path.includes('/KB') || path.includes('/Kettlebell')) {
          if (!eq.includes('Kettlebell') && !eq.some(e => e.toLowerCase().includes('kettlebell'))) {
            eq.push('Kettlebell')
          }
        }
        if (name.match(/\bBB\b/i) || name.match(/\bBarbell\b/i) || path.includes('/BB') || path.includes('/Barbell')) {
          if (!eq.includes('Barbell') && !eq.some(e => e.toLowerCase().includes('barbell'))) {
            eq.push('Barbell')
          }
        }
      }
      
      return eq
    })

    // Extract video
    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts,
      equipment,
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function addExRxExercise() {
  const url = 'https://exrx.net/WeightExercises/BackGeneral/DBBentOverRow'
  
  // Scrape fresh data
  const exrxData = await scrapeExRx(url)

  console.log('📝 Adding ExRx exercise to exercise_library...\n')
  console.log('Exercise:', exrxData.name)
  console.log('Description:', exrxData.description?.substring(0, 100) + '...')
  console.log('Body Parts:', exrxData.bodyParts.length > 0 ? exrxData.bodyParts.join(', ') : 'None')
  console.log('Equipment:', exrxData.equipment.length > 0 ? exrxData.equipment.join(', ') : 'None')
  console.log('Video URL:', exrxData.demoUrl)
  console.log('Source URL:', exrxData.sourceUrl)
  console.log()

  // Check if exercise already exists
  const { data: existing } = await supabase
    .from('exercise_library')
    .select('id, name')
    .ilike('name', exrxData.name)
    .maybeSingle()

  if (existing) {
    console.log(`⚠️  Exercise "${existing.name}" already exists with ID: ${existing.id}`)
    console.log('   Updating with new data...\n')
    
    const payload = {
      name: exrxData.name,
      description: exrxData.description,
      body_parts: exrxData.bodyParts.length > 0 ? exrxData.bodyParts : null,
      equipment: exrxData.equipment.length > 0 ? exrxData.equipment : null,
      injury_areas: exrxData.injuryAreas.length > 0 ? exrxData.injuryAreas : null,
      difficulty: exrxData.difficulty,
      external_video_url: exrxData.sourceUrl, // Store the ExRx page URL
      demo_file_path: null, // We're using external_video_url instead
      thumbnail_path: exrxData.thumbnailUrl,
      notes: `Scraped from ExRx. Video: ${exrxData.demoUrl}`
    }

    const { error: updateError, data: updated } = await supabase
      .from('exercise_library')
      .update(payload)
      .eq('id', existing.id)
      .select('id, name')
      .single()

    if (updateError) {
      console.error('❌ Failed to update exercise:', updateError.message)
      throw updateError
    }

    console.log(`✅ Successfully updated exercise: ${updated.name} (ID: ${updated.id})`)
    return updated.id
  }

  // Insert new exercise
  const payload = {
    name: exrxData.name,
    description: exrxData.description,
    body_parts: exrxData.bodyParts.length > 0 ? exrxData.bodyParts : null,
    equipment: exrxData.equipment.length > 0 ? exrxData.equipment : null,
    injury_areas: exrxData.injuryAreas.length > 0 ? exrxData.injuryAreas : null,
    difficulty: exrxData.difficulty,
    external_video_url: exrxData.sourceUrl, // Store the ExRx page URL
    demo_file_path: null, // We're using external_video_url instead
    thumbnail_path: exrxData.thumbnailUrl,
    notes: `Scraped from ExRx. Video: ${exrxData.demoUrl}`
  }

  const { error: insertError, data: inserted } = await supabase
    .from('exercise_library')
    .insert(payload)
    .select('id, name')
    .single()

  if (insertError) {
    console.error('❌ Failed to insert exercise:', insertError.message)
    throw insertError
  }

  console.log(`✅ Successfully added exercise: ${inserted.name} (ID: ${inserted.id})`)
  return inserted.id
}

addExRxExercise()
  .then((id) => {
    console.log(`\n🎉 Done! Exercise ID: ${id}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

