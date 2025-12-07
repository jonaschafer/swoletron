import { load } from 'cheerio'
import puppeteer, { Browser } from 'puppeteer'

export interface ExerciseData {
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

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function createBrowser(): Promise<Browser> {
  return await puppeteer.launch({ headless: 'new' })
}

async function scrapePage(url: string, waitTime: number = 2000): Promise<{ html: string; page: puppeteer.Page; browser: Browser }> {
  const browser = await createBrowser()
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent(USER_AGENT)
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise(resolve => setTimeout(resolve, waitTime))
    const html = await page.content()
    return { html, page, browser }
  } catch (error) {
    await browser.close()
    throw error
  }
}

// ExRx scraper
export async function scrapeExRx(url: string): Promise<ExerciseData> {
  console.log(`  Scraping ExRx: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser // Keep browser reference for cleanup
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
        if (name.match(/\bBW\b/i) || name.match(/\bBodyweight\b/i) || path.includes('/BW')) {
          if (!eq.includes('Bodyweight') && !eq.some(e => e.toLowerCase().includes('bodyweight'))) {
            eq.push('Bodyweight')
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

    await browser.close()
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
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// RehabHero scraper
export async function scrapeRehabHero(url: string): Promise<ExerciseData> {
  console.log(`  Scraping RehabHero: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    // Extract name
    let name = $('h1').first().text().trim() || $('title').text().trim()
    if (!name || name.length < 3) {
      const urlMatch = url.match(/exercise\/([^/?]+)/)
      if (urlMatch) {
        name = urlMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }

    // Extract description
    let description = ''
    $('p, .description, [class*="description"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 30 && !description && 
          !text.toLowerCase().includes('rehabhero') &&
          !text.toLowerCase().includes('copyright')) {
        description = text
      }
    })

    // Extract body parts and equipment from page content
    const bodyParts: string[] = []
    const equipment: string[] = []
    
    // Look for common patterns
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('glute')) bodyParts.push('glutes')
    if (bodyText.includes('hamstring')) bodyParts.push('hamstrings')
    if (bodyText.includes('quad')) bodyParts.push('quads')
    if (bodyText.includes('calf')) bodyParts.push('calves')
    if (bodyText.includes('ankle')) bodyParts.push('ankles')
    if (bodyText.includes('hip')) bodyParts.push('hip flexors')
    if (bodyText.includes('core') || bodyText.includes('abdominal')) bodyParts.push('core')
    if (bodyText.includes('shoulder')) bodyParts.push('shoulders')
    if (bodyText.includes('back')) bodyParts.push('back')
    
    if (bodyText.includes('band') || bodyText.includes('resistance band')) equipment.push('Resistance Band')
    if (bodyText.includes('bosu')) equipment.push('Bosu Ball')
    if (bodyText.includes('balance pad')) equipment.push('Balance Pad')
    if (bodyText.includes('towel')) equipment.push('Towel')

    // Extract video
    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    // Look for iframe videos
    if (!demoUrl) {
      const iframe = $('iframe[src*="youtube"], iframe[src*="vimeo"]').first().attr('src')
      if (iframe) demoUrl = iframe
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// WorkoutLabs scraper
export async function scrapeWorkoutLabs(url: string): Promise<ExerciseData> {
  console.log(`  Scraping WorkoutLabs: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.exercise-description, .description, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    // Extract from page content
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('pull-up') || bodyText.includes('lat')) bodyParts.push('lats')
    if (bodyText.includes('bicep')) bodyParts.push('biceps')
    if (bodyText.includes('back')) bodyParts.push('back')
    
    if (bodyText.includes('pull-up bar') || bodyText.includes('bar')) equipment.push('Pull-up Bar')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// Catalyst Athletics scraper
export async function scrapeCatalystAthletics(url: string): Promise<ExerciseData> {
  console.log(`  Scraping Catalyst Athletics: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.content, .exercise-content, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('core') || bodyText.includes('ab')) bodyParts.push('core')
    if (bodyText.includes('hip')) bodyParts.push('hip flexors')
    
    if (bodyText.includes('bodyweight')) equipment.push('Bodyweight')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// Muscle & Strength scraper
export async function scrapeMuscleAndStrength(url: string): Promise<ExerciseData> {
  console.log(`  Scraping Muscle & Strength: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.exercise-instructions, .instructions, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('face pull') || bodyText.includes('rear delt')) {
      bodyParts.push('rear delts')
      bodyParts.push('rhomboids')
    }
    
    if (bodyText.includes('band')) equipment.push('Resistance Band')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// ACE Fitness scraper (reuse some logic from import-ace-exercises.ts)
export async function scrapeACEFitness(url: string): Promise<ExerciseData> {
  console.log(`  Scraping ACE Fitness: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.exercise-description, .description, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('hamstring')) bodyParts.push('hamstrings')
    if (bodyText.includes('glute')) bodyParts.push('glutes')
    
    if (bodyText.includes('machine') || bodyText.includes('curl machine')) equipment.push('Machine')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// Programme.app scraper
export async function scrapeProgrammeApp(url: string): Promise<ExerciseData> {
  console.log(`  Scraping Programme.app: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.exercise-description, .description, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('quad') || bodyText.includes('step-down')) {
      bodyParts.push('quads')
      bodyParts.push('glutes')
    }
    
    if (bodyText.includes('box') || bodyText.includes('step')) equipment.push('Box')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// The Prehab Guys scraper (Vimeo videos)
export async function scrapePrehabGuys(url: string): Promise<ExerciseData> {
  console.log(`  Scraping The Prehab Guys: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('.description, p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('band pull')) {
      bodyParts.push('rear delts')
      bodyParts.push('rhomboids')
    }
    if (bodyText.includes('dead hang') || bodyText.includes('hang')) {
      bodyParts.push('lats')
      bodyParts.push('grip')
    }
    
    if (bodyText.includes('band')) equipment.push('Resistance Band')
    if (bodyText.includes('pull-up bar') || bodyText.includes('bar')) equipment.push('Pull-up Bar')

    // Extract Vimeo video
    let demoUrl: string | null = null
    const iframe = $('iframe[src*="vimeo"]').first().attr('src')
    if (iframe) {
      demoUrl = iframe
    } else {
      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video source') as HTMLSourceElement
        return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
      })
      if (videoSrc) {
        demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
      }
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// MuscleWiki scraper
export async function scrapeMuscleWiki(url: string): Promise<ExerciseData> {
  console.log(`  Scraping MuscleWiki: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 3000)
    browser = pageBrowser
    const $ = load(html)

    // Try to close modals
    try {
      const closeSelectors = [
        'button[aria-label*="close" i]',
        'button[aria-label*="dismiss" i]',
        '.modal-close',
        '.close-button'
      ]
      for (const selector of closeSelectors) {
        try {
          const closeBtn = await page.$(selector)
          if (closeBtn) {
            await closeBtn.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (e) {}
      }
    } catch (e) {}

    const name = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'))
      for (const h1 of h1s) {
        const text = h1.textContent?.trim() || ''
        if (text && text.length > 3 && 
            !text.toLowerCase().includes('simplify') &&
            !text.toLowerCase().includes('workout')) {
          return text
        }
      }
      return document.title.split('-')[0].trim()
    }) || ''

    let description = ''
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && !description && 
          !text.toLowerCase().includes('musclewiki') &&
          !text.toLowerCase().includes('generate')) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('wood chopper') || bodyText.includes('core')) {
      bodyParts.push('core')
      bodyParts.push('obliques')
    }
    
    if (bodyText.includes('kettlebell')) equipment.push('Kettlebell')
    if (bodyText.includes('dumbbell')) equipment.push('Dumbbell')

    // Extract video/GIF
    let demoUrl: string | null = null
    const gifImages = $('img[src*=".gif"], img[src*="gif"]')
    if (gifImages.length > 0) {
      const bestGif = gifImages.first().attr('src')
      if (bestGif) {
        demoUrl = bestGif.startsWith('http') ? bestGif : new URL(bestGif, url).toString()
      }
    }
    
    if (!demoUrl) {
      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video source') as HTMLSourceElement
        return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
      })
      if (videoSrc) {
        demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
      }
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// Benji Physio scraper
export async function scrapeBenjiPhysio(url: string): Promise<ExerciseData> {
  console.log(`  Scraping Benji Physio: ${url}`)
  
  let browser: Browser | null = null
  try {
    const { html, page, browser: pageBrowser } = await scrapePage(url, 2000)
    browser = pageBrowser
    const $ = load(html)

    const name = $('h1, h2').first().text().trim() || $('title').text().trim()
    
    let description = ''
    $('p, .content').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 30 && !description && 
          !text.toLowerCase().includes('benji') &&
          !text.toLowerCase().includes('physio')) {
        description = text
      }
    })

    const bodyParts: string[] = []
    const equipment: string[] = []
    
    const bodyText = $('body').text().toLowerCase()
    if (bodyText.includes('shoulder')) bodyParts.push('shoulders')
    if (bodyText.includes('core') || bodyText.includes('abdominal')) bodyParts.push('core')
    if (bodyText.includes('hip')) bodyParts.push('hip flexors')
    
    if (bodyText.includes('bodyweight')) equipment.push('Bodyweight')

    let demoUrl: string | null = null
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video source') as HTMLSourceElement
      return video?.src || (document.querySelector('video') as HTMLVideoElement)?.src || null
    })
    if (videoSrc) {
      demoUrl = videoSrc.startsWith('http') ? videoSrc : new URL(videoSrc, url).toString()
    }

    await browser.close()
    return {
      name: name || 'Unknown',
      description: description || null,
      bodyParts: [...new Set(bodyParts)],
      equipment: [...new Set(equipment)],
      difficulty: null,
      injuryAreas: [],
      demoUrl,
      thumbnailUrl: null,
      sourceUrl: url
    }
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

// Main scraper router
export async function scrapeExercise(url: string): Promise<ExerciseData> {
  if (url.includes('exrx.net')) {
    return scrapeExRx(url)
  } else if (url.includes('rehabhero.ca')) {
    return scrapeRehabHero(url)
  } else if (url.includes('workoutlabs.com')) {
    return scrapeWorkoutLabs(url)
  } else if (url.includes('catalystathletics.com')) {
    return scrapeCatalystAthletics(url)
  } else if (url.includes('muscleandstrength.com')) {
    return scrapeMuscleAndStrength(url)
  } else if (url.includes('acefitness.org')) {
    return scrapeACEFitness(url)
  } else if (url.includes('programme.app')) {
    return scrapeProgrammeApp(url)
  } else if (url.includes('theprehabguys.com')) {
    return scrapePrehabGuys(url)
  } else if (url.includes('musclewiki.com')) {
    return scrapeMuscleWiki(url)
  } else if (url.includes('benjiphysio.co.uk')) {
    return scrapeBenjiPhysio(url)
  } else {
    throw new Error(`Unknown website: ${url}`)
  }
}

