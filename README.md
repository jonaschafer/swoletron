# Swoletron

A simple workout tracking app that reads exercise data from Google Sheets.

## Features

- **Session Management**: Browse workout sessions organized by category
- **Exercise Tracking**: View exercises with sets, reps/duration, and weight
- **Interactive Editing**: Tap to edit sets, reps, weight, and notes (local only)
- **Media Support**: YouTube videos and images for exercise demonstrations
- **Mobile-First**: Optimized for mobile use with touch-friendly interface

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
