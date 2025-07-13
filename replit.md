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
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage replaces MemStorage)
- **Session Management**: Express sessions with PostgreSQL store
- **AI Integration**: Ollama API for DeepSeek model inference with intelligent fallback

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
- **Groq API Integration**: Ultra-fast AI inference via Groq cloud platform
- **DeepSeek R1 Distill Llama 70B**: Advanced medical reasoning and diagnosis generation
- **Llama 3.3 70B Versatile**: Interactive chat for follow-up questions and patient education
- **Intelligent Fallback**: Demo analysis system maintains functionality during API issues

## Data Flow

1. **Session Creation**: User starts consultation, creates session with unique ID in PostgreSQL
2. **Symptom Input**: User enters symptoms and patient information
3. **AI Analysis**: Symptoms processed through Groq API (DeepSeek R1 + Llama 3.3 models) with intelligent fallback system
4. **Result Processing**: AI response parsed into structured diagnostic data with interactive Q&A
5. **Database Storage**: All session data, diagnoses, and conversation history persisted to PostgreSQL
6. **Real-time Updates**: UI updates with analysis results, follow-up questions, and step-by-step action plans

## Recent Changes

### Visual Enhancement & Dark Mode (July 13, 2025)
- **Complete Dark Mode Support**: Added theme provider with light/dark/system themes
- **Enhanced Visual Design**: Modern gradients, glass-card effects, and medical-themed colors
- **Mobile Responsiveness**: Collapsible sidebar, optimized layouts, and touch-friendly interface
- **Header Layout Fix**: Widened header to prevent title text cutoff and improved responsive design
- **Professional Styling**: Enhanced consultation cards, loading overlays, and interactive animations

### Database Integration (July 13, 2025)
- **Added PostgreSQL database**: Migrated from in-memory storage to persistent database
- **Database Schema**: Full consultation sessions, diagnoses, and conversation tracking
- **Enhanced Q&A System**: Interactive follow-up questions with mode-specific responses
- **Intelligent Fallback**: Demo analysis system when Ollama is unavailable
- **Step-by-step Action Plans**: Clinical recommendations with red flag alerts

## External Dependencies

### AI/ML Services
- **Groq API**: Cloud-based AI inference for ultra-fast medical reasoning
- **DeepSeek R1 Distill Llama 70B**: Advanced reasoning model for diagnostic analysis
- **Llama 3.3 70B Versatile**: Chat model for interactive follow-up questions and patient education

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