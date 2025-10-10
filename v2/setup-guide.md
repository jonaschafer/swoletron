# Swoletron v2 - Setup Guide

Complete setup instructions for building your training app from scratch.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account (free tier is fine)
- Vercel account (free tier is fine)
- GitHub account

---

## Step 1: Create Project Structure

```bash
# Create main folder
mkdir swoletron-v2
cd swoletron-v2

# Initialize git
git init

# Create necessary folders
mkdir scripts
mkdir lib
mkdir app
```

---

## Step 2: Initialize Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

When prompted:
- ✅ TypeScript? **Yes**
- ✅ ESLint? **Yes**
- ✅ Tailwind CSS? **Yes**
- ✅ `src/` directory? **No**
- ✅ App Router? **Yes**
- ✅ Import alias? **Yes** (@/*)

---

## Step 3: Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# UI libraries
npm install lucide-react date-fns recharts

# Development tools
npm install -D tsx dotenv csv-parse
```

---

## Step 4: Create Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get these from:** Supabase Dashboard → Project Settings → API

---

## Step 5: Set Up Supabase

### 5.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Fill in project details
4. Wait for project to be created (~2 minutes)

### 5.2 Run Schema

1. Go to SQL Editor
2. Click "+ New query"
3. Copy entire contents of `schema.sql`
4. Paste and click "Run"
5. Verify tables created in Table Editor

---

## Step 6: Add CSV Data

1. Place `workouts.csv` in project root
2. Verify CSV is formatted correctly
3. Check dates are correct (Week 1 starts Oct 13, 2025)

---

## Step 7: Configure Import Script

Create `scripts/import-csv.ts` with the import script content.

Update `package.json` to add import script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "import": "tsx scripts/import-csv.ts"
  }
}
```

---

## Step 8: Run Import

```bash
npm run import
```

Expected output:
```
🚀 Starting CSV import...
✅ Parsed 122 records from CSV
✅ Successfully imported: 122 workouts
📊 Total workouts in database: 122
✨ Database is ready!
```

Verify in Supabase:
- Go to Table Editor
- Click on `workouts` table
- Should see 122 rows

---

## Step 9: Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export interface Workout {
  id: string
  date: string
  week_number: number
  workout_type: 'run' | 'strength' | 'micro' | 'rest'
  title: string
  description?: string
  duration_minutes?: number
  distance_miles?: number
  elevation_gain_feet?: number
  intensity?: string
  notes?: string
  phase: string
}

export async function getWorkoutsForWeek(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  if (error) throw error
  return data as Workout[]
}

export async function getWorkoutsForDate(date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('date', dateStr)
    .order('workout_type', { ascending: true })
  
  if (error) throw error
  return data as Workout[]
}
```

---

## Step 10: Create Calendar Page

Create `app/calendar/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getWorkoutsForWeek } from '@/lib/supabase'

export default function CalendarPage() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWorkouts() {
      // Get current week
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
      
      const data = await getWorkoutsForWeek(startOfWeek, endOfWeek)
      setWorkouts(data)
      setLoading(false)
    }
    
    loadWorkouts()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Training Calendar</h1>
      <div className="grid grid-cols-7 gap-4">
        {/* Render workouts here */}
        {workouts.map(workout => (
          <div key={workout.id} className="border p-2">
            <h3 className="font-semibold">{workout.title}</h3>
            <p className="text-sm text-gray-600">{workout.workout_type}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Step 11: Configure Tailwind

Create/update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
```

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Step 12: Create Root Layout

Create `app/layout.tsx`:

```typescript
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Swoletron v2',
  description: '12-Week Training App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

---

## Step 13: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000/calendar

You should see your training calendar!

---

## Step 14: Deploy to Vercel

### 14.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit - Swoletron v2"
git branch -M main
git remote add origin https://github.com/yourusername/swoletron.git
git push -u origin main
```

### 14.2 Deploy on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** Leave as `.` or set to `v2` if using monorepo
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

---

## Step 15: Verify Deployment

1. Wait for deployment to complete (~2 minutes)
2. Click "Visit" to open your deployed app
3. Navigate to `/calendar`
4. Verify workouts are displayed

---

## Troubleshooting

### Import fails with "table not found"
→ Run schema.sql in Supabase first

### Can't connect to Supabase
→ Check .env.local has correct URL and keys

### No workouts showing
→ Verify data imported (check Supabase Table Editor)

### Build fails on Vercel
→ Make sure environment variables are added in Vercel settings

### 404 on /calendar page
→ Ensure you're using App Router (not Pages Router)

---

## Next Steps

1. **Add authentication** - Implement Supabase Auth
2. **Build workout detail modal** - Click workouts to see full info
3. **Add completion tracking** - Mark workouts as complete
4. **Build exercise logging** - Track weights, reps, notes
5. **Create progress charts** - Visualize strength gains

---

## File Structure Summary

```
swoletron-v2/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── calendar/
│       └── page.tsx
├── lib/
│   └── supabase.ts
├── scripts/
│   └── import-csv.ts
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── workouts.csv
└── README.md
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run import           # Import CSV to Supabase

# Git
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit changes
git push                 # Push to GitHub
```

---

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

**You're all set!** Your training app is now live and ready to use. 🚀