# AI Diagnostic Copilot

## Overview

This is a sophisticated medical diagnostic application that serves as an intelligent assistant for both doctors and patients. The application leverages AI (specifically DeepSeek models via Ollama) to analyze symptoms and provide diagnostic recommendations, follow-up questions, and red flag warnings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server responsibilities:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom medical color scheme
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **AI Integration**: Ollama API for DeepSeek model inference

## Key Components

### Core Application Components
1. **ConsultationPanel**: Main interface for symptom input and analysis results
2. **ModeToggle**: Switches between doctor and patient modes
3. **SidebarPanel**: Displays session information, conversation history, and system status
4. **LoadingOverlay**: Provides feedback during AI analysis

### Data Models
- **Users**: Basic user management
- **ConsultationSessions**: Core session data with mode, patient info, and analysis results
- **Diagnoses**: Individual diagnostic results with confidence scores and recommendations
- **ConversationEntries**: Chat-like interaction history

### AI Service Integration
- **Symptom Analysis**: Processes user input through DeepSeek models
- **Diagnostic Generation**: Creates structured diagnostic results with confidence scores
- **Follow-up Questions**: Generates relevant questions for symptom clarification
- **Red Flag Detection**: Identifies potentially serious conditions requiring immediate attention

## Data Flow

1. **Session Creation**: User starts consultation, creates session with unique ID
2. **Symptom Input**: User enters symptoms and patient information
3. **AI Analysis**: Symptoms sent to Ollama API with DeepSeek models for processing
4. **Result Processing**: AI response parsed into structured diagnostic data
5. **Storage**: Results stored in PostgreSQL with conversation history
6. **Real-time Updates**: UI updates with analysis results and follow-up questions

## External Dependencies

### AI/ML Services
- **Ollama**: Local AI model serving (DeepSeek Reasoner and Chat models)
- **DeepSeek API**: Backup/alternative AI service integration

### Database
- **Neon Database**: Serverless PostgreSQL for production
- **Drizzle Kit**: Database migrations and schema management

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **TanStack Query**: Data fetching and caching

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **tsx**: TypeScript execution for backend
- **Replit Integration**: Built-in development tools and error overlay

### Production Build
- **Frontend**: Vite build outputs optimized static assets
- **Backend**: esbuild bundles server code for Node.js deployment
- **Database**: Drizzle migrations handle schema updates
- **Environment**: Configurable API endpoints and database connections

### Key Configuration
- Database schema located in `shared/schema.ts` for type safety
- AI service configuration in `server/config/api-config.ts`
- Path aliases configured for clean imports (`@/`, `@shared/`)
- Medical-themed color system in CSS custom properties

The application is designed to be deployed on platforms supporting Node.js with PostgreSQL database connectivity, with flexible AI service configuration for different deployment scenarios.