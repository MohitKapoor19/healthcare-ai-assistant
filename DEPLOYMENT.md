# Healthcare AI Assistant - Deployment Guide

## 🚀 Production Deployment Instructions

### Prerequisites
- Node.js 18+ 
- npm 8+
- PostgreSQL database (or Neon database)
- Groq AI API keys

### Environment Setup

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd HealthCare
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Configuration:**
```bash
cp .env.example .env
# Edit .env with your production values
```

### Required Environment Variables

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# AI Services
GROQ_API_KEY_REASONER=your_groq_reasoner_key
GROQ_API_KEY_CHAT=your_groq_chat_key

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
SESSION_SECRET=your_secure_random_string
COOKIE_SECURE=true
```

### Build and Deploy

#### Option 1: Docker Deployment (Recommended)

1. **Build the Docker image:**
```bash
docker build -t healthcare-ai .
```

2. **Run with Docker Compose:**
```bash
docker-compose up -d
```

3. **Check health:**
```bash
curl http://localhost:3000/api/health
```

#### Option 2: Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

### Platform-Specific Deployments

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your_db_url
# ... other env vars

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Configure build and run commands:
   - Build: `npm run build`
   - Run: `npm start`

### Performance Optimizations

#### 1. Enable Gzip Compression
The server automatically enables gzip compression in production.

#### 2. Static File Caching
Static files are served with appropriate cache headers.

#### 3. Database Connection Pooling
Ensure your DATABASE_URL includes connection pooling parameters.

#### 4. Redis Caching (Optional)
Uncomment Redis service in docker-compose.yml and set:
```env
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://redis:6379
```

### Monitoring and Health Checks

#### Health Check Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Logging
- Console logging is enabled by default
- File logging can be enabled with `ENABLE_FILE_LOGGING=true`
- Logs are written to `./logs/healthcare-ai.log`

### Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong, random session secrets
   - Enable HTTPS in production (`COOKIE_SECURE=true`)

2. **Rate Limiting:**
   - Default: 100 requests per minute
   - Configurable via `MAX_REQUESTS_PER_MINUTE`

3. **CORS:**
   - Automatically configured for production
   - Customize allowed origins if needed

### Troubleshooting

#### Common Issues

1. **Port already in use:**
```bash
# Change PORT in .env or kill existing process
lsof -ti:3000 | xargs kill -9
```

2. **Database connection issues:**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure SSL is properly configured

3. **Build failures:**
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

4. **Memory issues:**
   - Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Monitor memory usage in production

### Scaling

#### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Enable session store (Redis)
- Database read replicas

#### Vertical Scaling
- Monitor CPU and memory usage
- Adjust container resources
- Optimize database queries

### Backup Strategy

1. **Database Backups:**
   - Automated daily backups
   - Point-in-time recovery
   - Test restore procedures

2. **Application Backups:**
   - Version control (Git)
   - Container registry
   - Configuration management

### Maintenance

#### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix

# Rebuild and redeploy
npm run build
npm start
```

#### Database Migrations
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

### Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test health endpoint
4. Review database connectivity

Production checklist:
- [ ] Environment variables configured
- [ ] Database accessible
- [ ] API keys valid
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security headers enabled
