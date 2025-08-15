# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese learning content management application built with React, TypeScript, Vite, and Firebase. The app allows users to authenticate and manage their learning materials with CRUD operations.

## Key Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler first, then Vite build)
- `npm run lint` - Run ESLint on TypeScript/TSX files
- `npm run preview` - Preview production build locally

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript, Material-UI (MUI) for components
- **Build Tool**: Vite with React plugin
- **Database**: Firebase Firestore for data storage
- **Authentication**: Firebase Auth with email/password
- **Routing**: React Router DOM
- **Styling**: Material-UI theme system with Emotion

### Project Structure
- `src/firebase.ts` - Firebase configuration and service exports (auth, db)
- `src/App.tsx` - Main app component with authentication state and routing
- `src/components/` - React components:
  - `Login.tsx` - Email/password authentication form
  - `LearningList.tsx` - Display learning entries in grid layout with navigation
  - `LearningForm.tsx` - Add/edit learning entries with form validation

### Data Model
Learning entries stored in Firestore with:
- `topic`: string (max 100 chars)
- `content`: string (max 3000 chars) 
- `createdAt`: Date timestamp

### Authentication Flow
App checks Firebase auth state on mount. Unauthenticated users see login form, authenticated users access the main learning interface with routing.

### UI/UX Patterns
- Material-UI theme with primary blue (#1976d2) and secondary red (#dc004e)
- Japanese text throughout interface
- Responsive design with grid layouts
- Loading states and error handling with snackbar notifications
- Form validation with character limits and required fields