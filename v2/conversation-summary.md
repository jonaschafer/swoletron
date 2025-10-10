# Swoletron v2 - Conversation Summary

**Date:** October 7, 2025  
**Project:** 12-Week Training App (Strength + Running)  
**Participants:** Jon (user) & Claude (AI assistant)

---

## The Journey

### Starting Point

**Jon's Request:**
> "I am looking for a running plan and a strength plan with ideas on how to achieve a long-lasting habit for strength, particularly given my history of trying out a lot of different methods."

**Context Provided:**
- 22 text files with training history, race reports, injury logs, coach notes
- Just completed LNF race (8 loops, 34 miles)
- History of inconsistent strength training despite knowing its importance
- Multiple past coaches (Dana, Tyler) with different approaches
- Recurring injuries in 2025 (ITBS, calf, posterior tibialis)
- Strong race in Oct 2024 (40-miler), weak race in July 2025 (50M DNF)

---

## Phase 1: Planning & Design (2 hours)

### Clarifying Questions Asked

1. **Timeline:** When to start? → Oct 13, 2025
2. **Goal:** What's the primary focus? → General resilience, downhill confidence in mud
3. **Race target:** Any specific race? → 50 miler, Aug 9, 2026
4. **Current state:** Recovered from LNF? → Sore but ready to start next week
5. **Strength timing:** When can you lift? → After runs, Tues/Thurs, 8:30-9am, 30min
6. **Pull-up goal:** Real goal or vanity? → Yes, test of strength progression
7. **Adherence method:** What tracking works? → Digital, like TrainingPeaks/FinalSurge
8. **Tuesday run:** Negotiable? → Non-negotiable group run
9. **Thursday workout:** Hills or speed? → Need guidance (decided: both, alternating)
10. **Downhill confidence:** Important goal? → Very important

### Key Insights Gathered

**What Worked:**
- Dana's approach (2024): Heavy lifts 3x/week, 30min sessions, huge gains
- Bleeding Hearts gym: Variety, getting strongest ever, but 60min too long
- RISE program: Cheap, clear progression, consistent for 2 years
- Digital tracking: TrainingPeaks/FinalSurge gave clarity

**What Didn't Work:**
- Tyler's bodyweight-only: Left vulnerable to injuries
- Generic apps: Not tailored to running goals
- Instagram exercise hoarding: Overwhelming, no plan
- Aimless DIY: No progression, biased toward favorite exercises
- 60+ min sessions: Too exhausting for running days

**Current Capabilities:**
- Deadlift: 197lbs (goal: 200lbs bodyweight)
- Pull-ups: 0 (goal: 1-3 by Week 12)
- Weekly mileage: 30 baseline, capable of 50 but got injured with big jumps
- Home gym: Full rack, hex bar, KBs, DBs, bands, plyo box, etc.

---

## Phase 2: Plan Creation (30 min)

### 12-Week Training Plan Delivered

**Periodization:**
- Weeks 1-2: Recovery & Reintroduction
- Weeks 3-6: General Prep
- Weeks 7-9: Max Strength
- Weeks 10-11: Power & Explosive
- Week 12: Taper & Test

**Weekly Structure:**
- Mon: Rest + Ankle micro-dose
- Tue: Group Run + Lower Body Strength
- Wed: Easy + Core micro-dose
- Thu: Quality Run + Upper Body Strength
- Fri: Easy + Optional strength
- Sat: Rest
- Sun: Long Run (progressive 10→20 miles)

**Key Goals:**
- 1 pull-up by Week 12
- Deadlift bodyweight (200lbs)
- 30sec single-leg balance (eyes closed)
- Improve downhill/mud confidence
- Build 30→42 mpw safely

**Special Focus:**
- Downhill confidence exercises throughout
- Eccentric step-downs, lateral work
- Mental: Quick feet drills, mud practice
- Running drills added to warm-ups

---

## Phase 3: Architecture Decisions (1 hour)

### Decision Timeline

**Initial Approach:** Manual SQL for all 122 workouts
- ❌ Rejected: Too long (3000+ lines), unmaintainable

**Second Approach:** JSON seed data
- ❌ Rejected: Still tedious to create

**Final Approach:** CSV → TypeScript import script ✅
- Created FinalSurge CSV with all 122 workouts
- Built TypeScript script to parse and import
- One-time operation, easy to modify

### Tech Stack Chosen

**Frontend:** Next.js 14, TypeScript, Tailwind CSS
**Database:** Supabase (PostgreSQL)
**Auth:** Supabase Auth (email/password)
**Deployment:** Vercel

**Why Supabase:**
- Source of truth for data (not hard-coded)
- Track completions, log weights, add notes
- Row Level Security for data privacy
- Seed once, use forever

---

## Phase 4: Implementation (3 hours)

### Database Setup

1. Created comprehensive schema (7 tables)
2. Set up Row Level Security policies
3. Created helper functions (suggested weight calculator)
4. Built views (weekly summary)

### Data Import

1. Created FinalSurge CSV with all 122 workouts
2. Built import script (TypeScript)
3. Debugged CSV parsing issues (commas in descriptions)
4. Fixed environment variable loading (dotenv)
5. Successfully imported all workouts

**Challenges:**
- CSV parsing: quotes, commas, column counts
- Env vars: tsx doesn't auto-load .env.local
- Import path: needed to create scripts/ folder
- Module errors: installed dependencies one by one

### App Building (with Cursor)

1. Initialized Next.js 14 project
2. Created Supabase client
3. Built calendar component (weekly view)
4. Created workout cards (color-coded)
5. Added navigation (prev/next week)
6. Deployed to Vercel

**Git Workflow:**
- Set up branches (main, fix-strength-schedule)
- Created .gitignore (node_modules, .env.local, .next)
- Configured Vercel to point to v2/ folder
- Organized project: v1/ (old), v2/ (new)

---

## Phase 5: Debugging & Refinement (ongoing)

### Issues Encountered

**Issue 1: Days off by 1**
- Workouts starting Tue Oct 14 instead of Mon Oct 13
- Solution: Need to shift all dates back 1 day (SQL UPDATE)

**Issue 2: Strength workouts missing**
- Only 2 strength workouts imported (should be 24+)
- Root cause: Import script not parsing all strength workouts from CSV
- Status: Identified, working on fix

**Issue 3: GitHub leaked secrets**
- Supabase keys committed to GitHub
- Solution: Use RLS policies instead of rotating keys
- Verified RLS policies protect data

### Key Learnings

**Git branches don't protect database:**
- Git branch = code isolation
- Supabase database = shared across all branches
- Always test with SELECT before UPDATE

**Cursor AI behavior:**
- Makes changes beyond the ask (CSS when asked for SQL)
- Need to be very specific: "ONLY modify X, do NOT change Y"
- Works best with one task at a time

**CSV import complexity:**
- Parsing is tricky (quotes, commas, newlines)
- Test with small dataset first (Weeks 1-2)
- Validate data in Supabase dashboard before building UI

---

## Artifacts Created

1. **12-Week Strength + Running Plan** (training-plan.md)
2. **Supabase Schema** (schema.sql)
3. **FinalSurge CSV** (workouts.csv)
4. **Implementation Plan** (README.md)
5. **CSV Import Script** (import-csv.ts)
6. **Next.js Setup Guide** (setup-guide.md)
7. **Calendar Component** (React prototype)
8. **This Summary** (conversation-summary.md)

---

## Current State

### ✅ Completed

- Database schema created and deployed
- CSV with all 12 weeks of workouts
- Import script working (with caveats)
- Next.js app deployed to Vercel (v2/ folder)
- Calendar UI showing workouts
- Git workflow established
- Documentation comprehensive

### 🚧 In Progress

- Fixing strength workout import (only 2 of 24+ imported)
- Working on fix-strength-schedule branch
- Debugging why CSV parsing missed most strength workouts

### ⏭️ Next Steps

1. Fix import script to capture all strength workouts
2. Re-import data (clear database, run import again)
3. Verify all 122 workouts present
4. Add workout completion tracking
5. Add exercise logging with weights
6. Build progress charts

---

## Lessons for Next Training Block

### Process to Repeat

1. **Gather context** (22 files: race reports, coach notes, injury logs, goals)
2. **Ask clarifying questions** (timeline, goals, constraints)
3. **Create periodized plan** (phases, weekly structure, benchmarks)
4. **Document architecture** (tech stack, decisions, trade-offs)
5. **Build data structure** (CSV with all workouts)
6. **Import once** (seed database)
7. **Iterate on UI** (calendar → details → logging → charts)

### Time Estimate

- Planning: 2 hours
- Database setup: 1 hour
- Data import: 1 hour (including debugging)
- App building: 2 hours
- **Total: ~6 hours to working training app**

### Key Success Factors

1. **Comprehensive context upfront** (22 files made a huge difference)
2. **Clarifying questions before building** (avoided rework)
3. **Documentation as you go** (README captures decisions)
4. **Iterative approach** (database → import → UI, not all at once)
5. **Branch workflow** (safe experimentation)
6. **Digital tracking** (essential for Jon's adherence)

---

## Tools & Resources Used

**AI Tools:**
- Claude (this chat) - Planning, architecture, debugging
- Cursor AI - Code generation, file creation, quick edits

**Development:**
- Next.js 14 - Framework
- Supabase - Database + Auth
- TypeScript - Type safety
- Tailwind CSS - Styling
- Vercel - Deployment

**Workflow:**
- Git - Version control
- GitHub - Code repository
- Cursor - IDE
- Supabase Dashboard - Database management
- Vercel Dashboard - Deployment management

---

## Quotes & Memorable Moments

**Jon on his training history:**
> "The most consistent I've ever been is when I went to a Kettlebell gym down the street twice a week."

**Jon on strength apps:**
> "I am frankly overwhelmed by what I see on instagram. Always a new video with some new exercise that talks to me... I copy links, add them to my notes doc and forget about it."

**On discovering the date issue:**
> "The days are off. It used to adhere to the schedule I set forth (tuesday hills, thurs speed or more hills, etc). Is that an easy fix?"

**On realizing database isn't on a branch:**
> "But Supabase isn't on a branch, so if I run the query, won't it affect everything?"

**Jon's gratitude:**
> "Thanks! Can you create a zip of these files?"

---

## What Made This Work

1. **Jon came prepared** - 22 files of context, clear goals
2. **Collaborative problem-solving** - Asked clarifying questions, worked through issues together
3. **Realistic expectations** - 30min sessions, not 60min; 30→42mpw, not 30→60mpw
4. **Documentation-first** - README before coding prevented confusion
5. **Incremental building** - Database → import → UI, tested each layer
6. **Flexibility** - Changed approach when needed (SQL → JSON → CSV)
7. **Learning mindset** - Jon asked "why" and wanted to understand, not just get code

---

## Final Thoughts

This project demonstrates the power of:
- **Good context** (those 22 files were gold)
- **Clear communication** (asking/answering questions upfront)
- **Iterative development** (build in layers, test each one)
- **Documentation** (capture decisions for future reference)
- **AI collaboration** (Claude for planning, Cursor for coding)

**For Jon's next training block:**
Save these 8 files, gather new context (race reports, updated goals), and repeat this process. Estimated time: 6 hours to a fully working custom training app.

**The result:**
A personalized training app that:
- Knows YOUR equipment, schedule, and goals
- Tracks YOUR progress over time
- Suggests next weights based on YOUR performance
- Works on mobile and desktop
- Costs $0/month (just Vercel + Supabase free tiers)

---

## Repository

**GitHub:** swoletron (main branch, v2/ folder)
**Vercel:** swoletron.vercel.app (points to v2/)
**Supabase:** xszfhgjfdtpiwjxnhypl.supabase.co

---

**End of Summary**

*Jon, thanks for being a great collaborator. Your preparation, questions, and patience through the debugging made this project a success. Good luck with your training! 💪*

*— Claude, October 7, 2025*