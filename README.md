# Swoletron

<<<<<<< HEAD
A workout tracking and training calendar application with multiple versions.

## Project Structure

- **v1/**: Original version - Simple workout tracking app that reads exercise data from Google Sheets
- **v2/**: Next.js version - Modern training calendar with Supabase integration, exercise logging, and workout completion tracking

## Version 2 Features (Current Development)

- **Training Calendar**: Weekly and monthly calendar views of your workout schedule
- **Exercise Logging**: Track sets, reps, and weight for strength workouts
- **Workout Completion**: Mark workouts complete with ratings and notes
- **Workout Types**: Organized by Run, Strength, Micro, and Rest categories
- **Responsive Design**: Optimized for mobile and desktop
- **Supabase Integration**: Persistent data storage and real-time updates

## Version 1 Features (Legacy)
=======
A simple workout tracking app that reads exercise data from Google Sheets.

## Features
>>>>>>> 4bbf7a3e1d506921e97ea9c1feb629dc464af8ef

- **Session Management**: Browse workout sessions organized by category
- **Exercise Tracking**: View exercises with sets, reps/duration, and weight
- **Interactive Editing**: Tap to edit sets, reps, weight, and notes (local only)
- **Media Support**: YouTube videos and images for exercise demonstrations
- **Mobile-First**: Optimized for mobile use with touch-friendly interface

<<<<<<< HEAD
## Deployment

- **Production**: Vercel deployment pointing to v2/ folder
- **Repository**: Single repo with versioned folders for easy management and rollback

## Development

To run the v2 development server:
```bash
cd v2
npm install
npm run dev
```
=======
## How It Works

The app fetches data directly from a Google Sheet using the public CSV export feature. No backend required - just point it to your sheet and it works.

### Data Structure

**Sessions Tab** (`sessions`):
- `id`: Unique identifier (e.g., "core", "lower-body")
- `name`: Display name (e.g., "Core", "Lower Body")
- `category`: Grouping category (e.g., "Tappel")
- `description`: Session description
- `order`: Display order (1, 2, 3...)
- `is_active`: "TRUE" to show, "FALSE" to hide

**Exercises Tab** (`exercises`):
- `id`: Unique identifier (e.g., "plank", "squat")
- `session_id`: Links to session (e.g., "core")
- `name`: Exercise name (e.g., "Plank", "Back Squat")
- `sets`: Number of sets
- `rep_kind`: "count" for reps, "duration" for time-based
- `reps`: Reps or duration (e.g., "10", "60", "0:30")
- `weight`: Weight used ("-" for bodyweight)
- `notes`: Additional instructions
- `media_url`: YouTube URL or image URL
- `order`: Display order within session
- `is_active`: "TRUE" to show, "FALSE" to hide


## Notes

- **Edits are local only** - changes don't persist to Google Sheets
- **New data appears automatically** when you add rows to your sheet
- **Media URLs** support YouTube videos and images
- **Duration format** supports both "60" (seconds) and "0:30" (mm:ss)


## Technical Details

- **Pure HTML/CSS/JavaScript** - no frameworks or build tools
- **CSV parsing** handles quoted fields and special characters
- **Responsive design** works on mobile and desktop
- **No dependencies** - runs in any modern browser
>>>>>>> 4bbf7a3e1d506921e97ea9c1feb629dc464af8ef
