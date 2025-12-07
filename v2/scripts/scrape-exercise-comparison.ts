import axios from 'axios'
import { load } from 'cheerio'
import puppeteer, { Browser } from 'puppeteer'

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
    
    // Wait for main content to load, try to bypass any CAPTCHA/popups
    try {
      await page.waitForSelector('h1, table, .exercise', { timeout: 5000 })
    } catch (e) {
      // Continue even if selector not found
    }
    
    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const html = await page.content()
    const $ = load(html)

    // Extract name - ExRx typically has it in h1 or title
    // Skip if it's a CAPTCHA page
    let name = ''
    $('h1').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length > 3 && 
          !text.toLowerCase().includes('verify') &&
          !text.toLowerCase().includes('human') &&
          !text.toLowerCase().includes('captcha')) {
        name = text
        return false // break
      }
    })
    
    if (!name || name.length < 3) {
      const titleText = $('title').text().trim()
      if (titleText && !titleText.toLowerCase().includes('verify')) {
        name = titleText.replace(/\s*-\s*ExRx\.net.*/i, '').trim()
      }
    }
    
    // If still no good name, try to extract from URL
    if (!name || name.length < 3 || name.toLowerCase().includes('exrx.net')) {
      const urlMatch = url.match(/\/([^/]+)$/)
      if (urlMatch) {
        name = urlMatch[1].replace(/([A-Z])/g, ' $1').trim()
      }
    }

    // Extract description - look for paragraphs with substantial content
    // Skip CAPTCHA/verification text
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

    // Also check for description in divs
    if (!description) {
      $('div').each((_, el) => {
        const text = $(el).text().trim()
        if (text.length > 50 && text.length < 500 && !description &&
            !text.toLowerCase().includes('exrx') &&
            !text.toLowerCase().includes('copyright')) {
          description = text
        }
      })
    }

    // Extract body parts (muscles) - ExRx uses tables with various formats
    // Use Puppeteer to directly access DOM for better reliability
    const bodyParts: string[] = await page.evaluate(() => {
      const parts: string[] = []
      
      // Method 1: Look in tables with "Muscles" or "Muscle Groups" headers
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr')
        rows.forEach(row => {
          const th = row.querySelector('th')
          if (th) {
            const headerText = th.textContent?.trim().toLowerCase() || ''
            if (headerText.includes('muscle') || 
                headerText.includes('target') ||
                headerText.includes('primary') ||
                headerText.includes('secondary')) {
              const tds = row.querySelectorAll('td')
              tds.forEach(td => {
                // ExRx sometimes has multiple muscles in one cell, separated by commas or line breaks
                const text = td.textContent?.trim()
                if (text) {
                  // Split by common delimiters
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
      
      // Method 2: Look for muscle links (ExRx often links to muscle pages)
      const muscleLinks = document.querySelectorAll('a[href*="/Muscles/"], a[href*="/MuscleGroups/"]')
      muscleLinks.forEach(link => {
        const text = link.textContent?.trim()
        if (text && text.length > 0 && text.length < 100 && !parts.includes(text)) {
          parts.push(text)
        }
      })
      
      // Method 3: Look for text patterns like "Target: X, Y, Z" or "Muscles: X, Y"
      const allText = document.body.textContent || ''
      const targetMatch = allText.match(/(?:target|muscles?|primary|secondary)[:\s]+([^.\n]+)/i)
      if (targetMatch) {
        const muscleList = targetMatch[1].split(/[,;]/).map(m => m.trim()).filter(m => m.length > 0 && m.length < 100)
        muscleList.forEach(muscle => {
          if (!parts.includes(muscle)) {
            parts.push(muscle)
          }
        })
      }
      
      // Clean up and normalize body parts - remove duplicates and normalize
      const cleanedParts: string[] = []
      const seen = new Set<string>()
      
      parts.forEach(part => {
        // Remove trailing commas, periods, whitespace
        let cleaned = part.trim().replace(/[,;.\s]+$/, '')
        
        if (cleaned.length === 0 || cleaned.length >= 100) return
        
        // Normalize to lowercase for duplicate checking
        const normalized = cleaned.toLowerCase()
        
        // Check if this is a duplicate or subset of another entry
        let isDuplicate = false
        for (const existing of cleanedParts) {
          const existingNormalized = existing.toLowerCase()
          // Exact match
          if (normalized === existingNormalized) {
            isDuplicate = true
            break
          }
          // One contains the other (e.g., "Triceps" vs "Triceps, Long Head")
          if (normalized.includes(existingNormalized) || existingNormalized.includes(normalized)) {
            // Keep the more specific one
            if (cleaned.length > existing.length) {
              // Replace the less specific one
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

    // Extract equipment - ExRx uses various formats
    const equipment: string[] = await page.evaluate(() => {
      const eq: string[] = []
      
      // Method 1: Look in tables with "Equipment" header
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
                  // Split by common delimiters
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
      
      // Method 2: Look for equipment links
      const equipmentLinks = document.querySelectorAll('a[href*="/Equipment/"]')
      equipmentLinks.forEach(link => {
        const text = link.textContent?.trim()
        if (text && text.length > 0 && text.length < 100 && !eq.includes(text)) {
          eq.push(text)
        }
      })
      
      // Method 3: Look for text patterns like "Equipment: X, Y" or extract from exercise name
      const allText = document.body.textContent || ''
      const equipmentMatch = allText.match(/(?:equipment|requires?)[:\s]+([^.\n]+)/i)
      if (equipmentMatch) {
        const equipmentList = equipmentMatch[1].split(/[,;]/).map(e => e.trim()).filter(e => e.length > 0 && e.length < 100)
        equipmentList.forEach(item => {
          if (!eq.includes(item)) {
            eq.push(item)
          }
        })
      }
      
      // Method 4: Extract from exercise name (e.g., "DB Bent-over Row" -> "Dumbbell")
      const h1 = document.querySelector('h1')
      if (h1) {
        const name = h1.textContent?.trim() || ''
        // Common abbreviations and full words
        if (name.match(/\bDB\b/i) || name.match(/\bDumbbell\b/i)) {
          if (!eq.includes('Dumbbell') && !eq.some(e => e.toLowerCase().includes('dumbbell'))) {
            eq.push('Dumbbell')
          }
        }
        if (name.match(/\bKB\b/i) || name.match(/\bKettlebell\b/i)) {
          if (!eq.includes('Kettlebell') && !eq.some(e => e.toLowerCase().includes('kettlebell'))) {
            eq.push('Kettlebell')
          }
        }
        if (name.match(/\bBB\b/i) || name.match(/\bBarbell\b/i)) {
          if (!eq.includes('Barbell') && !eq.some(e => e.toLowerCase().includes('barbell'))) {
            eq.push('Barbell')
          }
        }
        if (name.match(/\bBW\b/i) || name.match(/\bBodyweight\b/i)) {
          if (!eq.includes('Bodyweight') && !eq.some(e => e.toLowerCase().includes('bodyweight'))) {
            eq.push('Bodyweight')
          }
        }
        if (name.match(/\bCable\b/i)) {
          if (!eq.includes('Cable') && !eq.some(e => e.toLowerCase().includes('cable'))) {
            eq.push('Cable')
          }
        }
        if (name.match(/\bBand\b/i) || name.match(/\bResistance Band\b/i)) {
          if (!eq.includes('Resistance Band') && !eq.some(e => e.toLowerCase().includes('band'))) {
            eq.push('Resistance Band')
          }
        }
        if (name.match(/\bBench\b/i)) {
          if (!eq.includes('Bench') && !eq.some(e => e.toLowerCase().includes('bench'))) {
            eq.push('Bench')
          }
        }
      }
      
      // Method 5: Check URL path for equipment hints
      const path = window.location.pathname
      if (path.includes('/DB') || path.includes('/Dumbbell')) {
        if (!eq.includes('Dumbbell') && !eq.some(e => e.toLowerCase().includes('dumbbell'))) {
          eq.push('Dumbbell')
        }
      }
      if (path.includes('/KB') || path.includes('/Kettlebell')) {
        if (!eq.includes('Kettlebell') && !eq.some(e => e.toLowerCase().includes('kettlebell'))) {
          eq.push('Kettlebell')
        }
      }
      if (path.includes('/BB') || path.includes('/Barbell')) {
        if (!eq.includes('Barbell') && !eq.some(e => e.toLowerCase().includes('barbell'))) {
          eq.push('Barbell')
        }
      }
      
      return eq
  })

  // Extract images/videos
  let demoUrl: string | null = null
  let thumbnailUrl: string | null = null

    // Look for video elements
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    // Look for images - ExRx often has exercise images
    const images = $('img[src*="exercise"], img[src*="muscle"], img[src*="ExRx"]')
  if (images.length > 0) {
      // Prefer larger images (likely the main exercise image)
      let bestImg: string | null = null
      images.each((_, img) => {
        const src = $(img).attr('src')
        const alt = $(img).attr('alt') || ''
        if (src && !src.includes('icon') && !src.includes('logo')) {
          if (!bestImg || alt.toLowerCase().includes('exercise')) {
            bestImg = src
          }
        }
      })
      if (bestImg) {
        thumbnailUrl = bestImg.startsWith('http') ? bestImg : new URL(bestImg, url).toString()
    }
  }

    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts,
      equipment,
      difficulty: null, // ExRx doesn't typically have difficulty
      injuryAreas: [],
      demoUrl,
      thumbnailUrl,
      sourceUrl: url
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function scrapeMuscleWiki(url: string): Promise<ExerciseData> {
  console.log(`\n🔍 Scraping MuscleWiki: ${url}`)
  
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Set user agent to appear more like a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // Try to close any modals/popups
    try {
      // Look for common close button selectors
      const closeSelectors = [
        'button[aria-label*="close" i]',
        'button[aria-label*="dismiss" i]',
        '.modal-close',
        '.close-button',
        '[data-dismiss="modal"]',
        'button:has-text("Close")',
        'button:has-text("×")'
      ]
      
      for (const selector of closeSelectors) {
        try {
          const closeBtn = await page.$(selector)
          if (closeBtn) {
            await closeBtn.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (e) {
          // Continue if selector not found
        }
      }
    } catch (e) {
      // Continue even if popup handling fails
    }
    
    // Wait for main content
    try {
      await page.waitForSelector('h1, video, img[src*=".gif"], [class*="exercise"]', { timeout: 5000 })
    } catch (e) {
      // Continue even if selector not found
    }
    
    // Wait for any dynamic content (MuscleWiki may load content dynamically)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const html = await page.content()
    const $ = load(html)

    // Extract name - use Puppeteer to find the actual exercise name
    const name = await page.evaluate(() => {
      // Try to find h1 that's not in a modal/popup
      const h1s = Array.from(document.querySelectorAll('h1'))
      for (const h1 of h1s) {
        const text = h1.textContent?.trim() || ''
        if (text && text.length > 3 && 
            !text.toLowerCase().includes('simplify') &&
            !text.toLowerCase().includes('workout') &&
            !text.toLowerCase().includes('generate') &&
            !text.toLowerCase().includes('exercise guide')) {
          return text
        }
      }
      
      // Try title tag
      const title = document.title
      if (title && !title.toLowerCase().includes('simplify')) {
        // Extract exercise name from title like "Dumbbell Row Bilateral Exercise Guide..."
        const match = title.match(/^([^-|]+)/)
        if (match) {
          return match[1].trim()
        }
      }
      
      return null
    }) || ''
    
    // If still no good name, extract from URL
    let finalName = name
    if (!finalName || finalName.length < 3) {
      const urlMatch = url.match(/exercise\/([^/]+)/)
      if (urlMatch) {
        finalName = urlMatch[1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    }

    // Extract description - MuscleWiki often has exercise instructions
    // Skip popup/ad text
  let description = ''
  $('p').each((_, el) => {
    const text = $(el).text().trim()
      if (text.length > 50 && !description && 
          !text.toLowerCase().includes('musclewiki') &&
          !text.toLowerCase().includes('copyright') &&
          !text.toLowerCase().includes('privacy') &&
          !text.toLowerCase().includes('generate') &&
          !text.toLowerCase().includes('workout') &&
          !text.toLowerCase().includes('watch a short ad') &&
          !text.toLowerCase().includes('already generated')) {
      description = text
    }
  })

    // Also check divs for instructions
    if (!description) {
      $('div[class*="description"], div[class*="instruction"], div[class*="content"]').each((_, el) => {
        const text = $(el).text().trim()
        if (text.length > 50 && text.length < 1000 && !description &&
            !text.toLowerCase().includes('musclewiki')) {
          description = text
        }
      })
    }

    // Extract body parts (target muscles) - use Puppeteer for better access
    const bodyParts: string[] = await page.evaluate(() => {
      const parts: string[] = []
      
      // Look for common patterns in MuscleWiki
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        const text = el.textContent?.trim() || ''
        const tagName = el.tagName.toLowerCase()
        
        // Look for labels like "Target", "Muscle", "Primary"
        if ((tagName === 'strong' || tagName === 'b' || tagName === 'label') &&
            (text.toLowerCase().includes('target') || 
             text.toLowerCase().includes('muscle') ||
             text.toLowerCase().includes('primary'))) {
          // Get siblings or children
          let parent = el.parentElement
          if (parent) {
            parent.querySelectorAll('a, span, div, p').forEach(child => {
              const childText = child.textContent?.trim() || ''
              if (childText && childText.length > 0 && childText.length < 50 &&
                  !childText.toLowerCase().includes('target') &&
                  !childText.toLowerCase().includes('muscle') &&
                  !parts.includes(childText)) {
                parts.push(childText)
              }
            })
          }
        }
      })
      
      return parts
  })

  // Extract equipment
    const equipment: string[] = await page.evaluate(() => {
      const eq: string[] = []
      
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        const text = el.textContent?.trim() || ''
        const tagName = el.tagName.toLowerCase()
        
        if ((tagName === 'strong' || tagName === 'b' || tagName === 'label') &&
            text.toLowerCase().includes('equipment')) {
          let parent = el.parentElement
          if (parent) {
            parent.querySelectorAll('a, span, div, p').forEach(child => {
              const childText = child.textContent?.trim() || ''
              if (childText && childText.length > 0 && childText.length < 50 &&
                  !eq.includes(childText)) {
                eq.push(childText)
              }
            })
          }
        }
      })
      
      return eq
    })

    // Extract images/videos - MuscleWiki often has animated GIFs
  let demoUrl: string | null = null
  let thumbnailUrl: string | null = null

    // Look for video elements
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    // Look for animated GIFs (MuscleWiki's signature feature)
    const gifImages = $('img[src*=".gif"], img[src*="gif"]')
    if (gifImages.length > 0) {
      // Find the main exercise GIF (usually the largest or most prominent)
      let bestGif: string | null = null
      gifImages.each((_, img) => {
        const src = $(img).attr('src')
        if (src && !src.includes('icon') && !src.includes('logo')) {
          if (!bestGif || src.includes('exercise')) {
            bestGif = src
          }
        }
      })
      if (bestGif) {
        demoUrl = bestGif.startsWith('http') ? bestGif : new URL(bestGif, url).toString()
      }
    }

    // Look for regular images (thumbnails)
    const images = $('img[src*="exercise"], img[alt*="exercise"], img[src*="jpg"], img[src*="png"]')
    if (images.length > 0) {
      let bestImg: string | null = null
      images.each((_, img) => {
        const src = $(img).attr('src')
        const alt = $(img).attr('alt') || ''
        if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('.gif')) {
          if (!bestImg || alt.toLowerCase().includes('exercise')) {
            bestImg = src
          }
        }
      })
      if (bestImg) {
        thumbnailUrl = bestImg.startsWith('http') ? bestImg : new URL(bestImg, url).toString()
    }
  }

    return {
      name: finalName || 'Unknown',
      description: description || null,
      bodyParts,
      equipment,
      difficulty: null, // MuscleWiki doesn't typically have difficulty
      injuryAreas: [],
      demoUrl,
      thumbnailUrl,
      sourceUrl: url
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function printComparison(exrx: ExerciseData, musclewiki: ExerciseData) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 COMPARISON: Dumbbell Row')
  console.log('='.repeat(80))

  console.log('\n📝 NAME:')
  console.log(`   ExRx:      ${exrx.name}`)
  console.log(`   MuscleWiki: ${musclewiki.name}`)

  console.log('\n📄 DESCRIPTION:')
  console.log(`   ExRx:      ${exrx.description ? exrx.description.substring(0, 100) + '...' : '❌ None'}`)
  console.log(`   MuscleWiki: ${musclewiki.description ? musclewiki.description.substring(0, 100) + '...' : '❌ None'}`)

  console.log('\n💪 BODY PARTS:')
  console.log(`   ExRx:      ${exrx.bodyParts.length > 0 ? exrx.bodyParts.join(', ') : '❌ None'}`)
  console.log(`   MuscleWiki: ${musclewiki.bodyParts.length > 0 ? musclewiki.bodyParts.join(', ') : '❌ None'}`)

  console.log('\n🏋️  EQUIPMENT:')
  console.log(`   ExRx:      ${exrx.equipment.length > 0 ? exrx.equipment.join(', ') : '❌ None'}`)
  console.log(`   MuscleWiki: ${musclewiki.equipment.length > 0 ? musclewiki.equipment.join(', ') : '❌ None'}`)

  console.log('\n🎥 DEMO VIDEO/GIF:')
  console.log(`   ExRx:      ${exrx.demoUrl ? '✅ ' + exrx.demoUrl : '❌ None'}`)
  console.log(`   MuscleWiki: ${musclewiki.demoUrl ? '✅ ' + musclewiki.demoUrl : '❌ None'}`)

  console.log('\n🖼️  THUMBNAIL IMAGE:')
  console.log(`   ExRx:      ${exrx.thumbnailUrl ? '✅ ' + exrx.thumbnailUrl : '❌ None'}`)
  console.log(`   MuscleWiki: ${musclewiki.thumbnailUrl ? '✅ ' + musclewiki.thumbnailUrl : '❌ None'}`)

  console.log('\n' + '='.repeat(80))
  console.log('🏆 RECOMMENDATION:')
  console.log('='.repeat(80))

  let exrxScore = 0
  let musclewikiScore = 0

  if (exrx.name && exrx.name !== 'Unknown') exrxScore += 1
  if (musclewiki.name && musclewiki.name !== 'Unknown') musclewikiScore += 1

  if (exrx.description) exrxScore += 2
  if (musclewiki.description) musclewikiScore += 2

  if (exrx.bodyParts.length > 0) exrxScore += 2
  if (musclewiki.bodyParts.length > 0) musclewikiScore += 2

  if (exrx.equipment.length > 0) exrxScore += 1
  if (musclewiki.equipment.length > 0) musclewikiScore += 1

  if (exrx.demoUrl) exrxScore += 3
  if (musclewiki.demoUrl) musclewikiScore += 3

  if (exrx.thumbnailUrl) exrxScore += 1
  if (musclewiki.thumbnailUrl) musclewikiScore += 1

  console.log(`\n   ExRx Score:      ${exrxScore}/10`)
  console.log(`   MuscleWiki Score: ${musclewikiScore}/10`)

  if (exrxScore > musclewikiScore) {
    console.log(`\n   ✅ RECOMMEND: ExRx (better data quality)`)
    console.log(`\n   📋 ExRx Data:`)
    console.log(JSON.stringify(exrx, null, 2))
  } else if (musclewikiScore > exrxScore) {
    console.log(`\n   ✅ RECOMMEND: MuscleWiki (better data quality)`)
    console.log(`\n   📋 MuscleWiki Data:`)
    console.log(JSON.stringify(musclewiki, null, 2))
  } else {
    console.log(`\n   ⚖️  TIE: Both have similar quality. Choose based on media availability.`)
    console.log(`\n   📋 ExRx Data:`)
    console.log(JSON.stringify(exrx, null, 2))
    console.log(`\n   📋 MuscleWiki Data:`)
    console.log(JSON.stringify(musclewiki, null, 2))
  }
}

async function run() {
  const exrxUrl = 'https://exrx.net/WeightExercises/BackGeneral/DBBentOverRow'
  const musclewikiUrl = 'https://musclewiki.com/exercise/dumbbell-row-bilateral'

  try {
    const [exrx, musclewiki] = await Promise.all([
      scrapeExRx(exrxUrl),
      scrapeMuscleWiki(musclewikiUrl)
    ])

    printComparison(exrx, musclewiki)
  } catch (error) {
    console.error('❌ Scraping failed:', error)
    process.exitCode = 1
  }
}

run()

