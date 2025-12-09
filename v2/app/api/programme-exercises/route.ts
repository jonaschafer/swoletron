import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  const startTime = Date.now()
  try {
    const filePath = path.join(process.cwd(), 'programme-all-exercises.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const exercises = JSON.parse(fileContents)
    const duration = Date.now() - startTime
    console.log(`[API Performance] Loaded ${exercises.length} exercises in ${duration}ms`)
    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error reading programme exercises:', error)
    return NextResponse.json({ error: 'Failed to load exercises' }, { status: 500 })
  }
}

