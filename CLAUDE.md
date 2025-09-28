# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese learning content management application built with React, TypeScript, Vite, and Firebase. The app allows users to authenticate and manage their learning materials with CRUD operations, including review scheduling and related learning tracking.

## Key Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler first, then Vite build)
- `npm run lint` - Run ESLint on TypeScript/TSX files
- `npm run preview` - Preview production build locally

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript, Material-UI (MUI) v7 for components
- **Build Tool**: Vite 7 with React plugin
- **State Management**: Redux Toolkit (RTK) with typed hooks
- **Database**: Firebase Firestore v12 for data storage
- **Authentication**: Firebase Auth with email/password
- **Routing**: React Router DOM v7
- **Styling**: Material-UI theme system with Emotion

### Project Structure
- `src/firebase.ts` - Firebase configuration and service exports (auth, db)
- `src/App.tsx` - Main app component with Redux Provider, theme, routing, and lazy loading
- `src/store/` - Redux Toolkit state management:
  - `index.ts` - Store configuration with authReducer, learningReducer, uiReducer
  - `hooks/index.ts` - Typed Redux hooks (useAppDispatch, useAppSelector)
  - `slices/authSlice.ts` - Authentication state with createAsyncThunk for login/logout/initializeAuth
  - `slices/learningSlice.ts` - Learning data state with async thunks for CRUD operations
  - `slices/uiSlice.ts` - UI state (alerts, filters)
- `src/components/` - React components:
  - `Login.tsx` - Email/password authentication form
  - `LearningList.tsx` - Grid display with review status, filtering, overdue alerts
  - `LearningForm.tsx` - Add/edit entries with form validation
  - `LearningDetail.tsx` - Detail view with related learnings navigation
  - `Header.tsx` - App header with navigation and logout
  - `LoadingSpinner.tsx` - Reusable loading component

### Data Model
Learning entries stored in Firestore with:
- `topic`: string (max 100 chars)
- `content`: string (max 3000 chars)
- `createdAt`: Date timestamp
- `reviewDate`: Date (optional) - scheduled review date
- `relatedLearnings`: string[] (optional) - IDs of related learning entries

### State Management with Redux Toolkit
- **Auth State**: User authentication status, loading, error handling
- **Learning State**: Learnings list, current learning, loading states
- **UI State**: Alert notifications, filter state, topic search filter
- **Async Operations**: All Firebase operations use createAsyncThunk for proper loading/error states
- **Type Safety**: Full TypeScript integration with RootState and AppDispatch types

### Authentication Flow
App uses Redux for auth state management. On mount, `initializeAuth` thunk checks Firebase auth state. Unauthenticated users see Login component, authenticated users access main interface with routing and lazy-loaded components.

### UI/UX Patterns
- Custom Material-UI theme with primary blue (#2563eb), comprehensive color palette, and modern shadows
- Japanese text throughout interface
- Lazy loading for route components with Suspense fallbacks
- Review status tracking with color-coded chips (success/warning/error)
- Overdue learning items highlighted with red borders and alerts
- Topic filtering with search UI
- Responsive grid layouts with hover animations
- Form validation with character limits and required fields
- Loading states and error handling via Redux