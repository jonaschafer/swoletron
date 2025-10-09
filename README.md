# Swoletron

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

- **Session Management**: Browse workout sessions organized by category
- **Exercise Tracking**: View exercises with sets, reps/duration, and weight
- **Interactive Editing**: Tap to edit sets, reps, weight, and notes (local only)
- **Media Support**: YouTube videos and images for exercise demonstrations
- **Mobile-First**: Optimized for mobile use with touch-friendly interface

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
