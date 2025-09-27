# Overview

This is an Emergency Services Personnel Management System designed for Iranian emergency medical services. The application manages personnel scheduling, shift assignments, and performance tracking with support for Jalali (Persian) calendar system. It features a React frontend with a modern UI built using shadcn/ui components and an Express.js backend with PostgreSQL database integration through Drizzle ORM.

# Recent Changes

## Performance Logging Fixes (September 27, 2025)
- **Fixed Authentication Issues**: Resolved 500 errors when non-admin users accessed performance logging by changing `/api/bases` from admin-only to authenticated access
- **Base Access Permissions**: Updated base API endpoints to allow regular users to view bases in dropdowns while maintaining admin restrictions for modifications
- **Personnel Data Loading**: Fixed personnel endpoint for regular users to properly load base members instead of attempting unauthorized base filtering
- **Guest Personnel Conversion**: Converted guest personnel addition from text inputs to dropdown selection from existing database personnel
- **Base Members Count**: Fixed supervisor home page showing zero base members by updating the personnel endpoint to use proper base member relationships
- **UI/UX Improvements**: Enhanced dropdown functionality with loading states, filtering, and proper error handling

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Components**: shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom Persian/Farsi design system and RTL support
- **State Management**: Zustand for authentication state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Internationalization**: Built-in Persian/Farsi language support with Jalali calendar utilities

## Backend Architecture
- **Framework**: Express.js with TypeScript for API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **API Design**: RESTful endpoints for CRUD operations on users, personnel, shifts, bases, and performance assignments
- **Validation**: Zod schemas shared between frontend and backend for consistent validation

## Database Schema
- **Users Table**: Authentication with role-based access (admin/user)
- **Personnel Table**: Employee information with employment status, productivity status, and driver classification
- **Work Shifts Table**: Shift definitions with equivalent hours and unique codes
- **Bases Table**: Location management for urban and road mission types
- **Performance Assignments Table**: Junction table linking personnel, shifts, bases, and dates with Jalali calendar support

## Authentication & Authorization
- **Simple Authentication**: Username/password with role-based access control
- **Session Persistence**: Browser storage for authentication state
- **Route Protection**: Client-side route guards for protected pages
- **Role Management**: Admin and user roles with different permission levels

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **Session Store**: PostgreSQL-based session storage (connect-pg-simple)

## UI & Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Modern icon library for consistent iconography
- **Class Variance Authority**: Utility for managing conditional CSS classes

## Data Management
- **TanStack Query**: Powerful data fetching and caching library
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation library
- **date-fns**: Modern JavaScript date utility library

## Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking for improved developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development environment integration for live preview and error handling

## Export & Utilities
- **XLSX**: Excel file generation for data export functionality
- **Embla Carousel**: Touch-friendly carousel component
- **CMDK**: Command menu component for enhanced user experience