# ISA820 - The Forensic Standard
## Complete Deployment & Transfer Package

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Options](#deployment-options)
   - [Option A: Docker (Recommended)](#option-a-docker-recommended)
   - [Option B: Traditional Server](#option-b-traditional-server)
   - [Option C: Nginx + Node.js](#option-c-nginx--nodejs)
6. [Supabase Database Setup](#supabase-database-setup)
7. [KVM Server Setup](#kvm-server-setup)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Extract the Package
```bash
unzip ISA820-Deployment-Package.zip
cd ISA820
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
nano .env.local
```

### 3. Build & Run
```bash
npm install
npm run build
npm start
```

Access at `http://localhost:3000`

---

## Project Structure

```
ISA820/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── globals.css          # Global styles
│   │   └── admin/               # Admin panel
│   ├── shared/components/       # Reusable UI components
│   │   ├── BibleReader.tsx      # Main Bible display
│   │   ├── PassageSelector.tsx   # Search & navigation
│   │   ├── VisualLibraryBrowser.tsx # 66-book grid
│   │   ├── ForensicSidebar.tsx   # AI rebuttal panel
│   │   ├── StrongsPanel.tsx     # Strong's lexicon
│   │   ├── PillarHeader.tsx     # Navigation pillars
│   │   └── AdminVaultManager.tsx # Content management
│   ├── store/                   # Zustand state management
│   ├── lib/                     # Utilities & Supabase client
│   ├── types/                   # TypeScript definitions
│   └── server/services/         # API service layer
├── public/                      # Static assets
├── supabase/
│   └── migrations/              # Database schema
├── out/                         # Production build output
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Multi-container setup
├── nginx.conf                   # Nginx reverse proxy
├── DEPLOYMENT.md                # This file
└── README.md                    # Project documentation
```

---

## Prerequisites

### For Development
- Node.js 20.x or higher
- npm 9.x or higher
- Git

### For Production
- Node.js 20.x (server)
- Docker & Docker Compose (optional but recommended)
- Nginx (for reverse proxy)
- PostgreSQL-compatible database (Supabase or self-hosted)

---

## Environment Configuration

Create a `.env.local` file with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Abacus AI (when ready)
ABACUS_API_ENDPOINT=https://api.abacus.ai/v1/analyze
ABACUS_API_KEY=your-abacus-key-here
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Deployment Options

### Option A: Docker (Recommended)

#### Quick Docker Deployment
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Production Docker with Nginx
```bash
# Start with nginx reverse proxy
docker-compose up -d nginx

# View nginx logs
docker-compose logs -f nginx
```

#### Docker Commands Reference
```bash
# Rebuild after code changes
docker-compose up -d --build

# Enter container shell
docker exec -it isa820-isa820-1 /bin/sh

# Check container health
docker inspect isa820-isa820-1 | grep -A 10 Health
```

---

### Option B: Traditional Server

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone/copy project
cd /var/www/isa820

# Install dependencies
npm install

# Build
npm run build

# Run with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "isa820" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

---

### Option C: Nginx + Node.js

#### Step 1: Build the Application
```bash
npm run build
```

#### Step 2: Configure Nginx
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/isa820

# Edit with your domain
sudo nano /etc/nginx/sites-available/isa820

# Enable site
sudo ln -s /etc/nginx/sites-available/isa820 /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Step 3: Run the App
```bash
# Run in background with PM2
pm2 start node_modules/.bin/next start --name "isa820"

# Or run directly
npm start
```

---

## Supabase Database Setup

### 1. Run the SQL Migration

Go to your Supabase Dashboard → SQL Editor and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

Or via CLI:
```bash
npx supabase db push
```

### 2. What the Schema Creates

| Table | Purpose |
|-------|---------|
| `verses` | Bible verses with translations, speakers, pillar tags |
| `strongs_lexicon` | Hebrew/Greek lexicon definitions |
| `strongs_usage` | Word usage traces across manuscripts |
| `knowledge_base` | Spiritual understandings & AI rebuttals |
| `media_assets` | Videos, images, graphics |
| `topic_mappings` | Verse-to-media relationships |
| `standard_documents` | Research documents |

### 3. Seed Sample Data

The schema includes sample data for Genesis 1. Add more verses as needed.

---

## KVM Server Setup

### Step 1: Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 2: Deploy with Docker
```bash
# Copy project to server
scp -r ISA820 user@your-server:/var/www/

# SSH into server
ssh user@your-server

# Configure environment
cd /var/www/ISA820
cp .env.example .env.local
nano .env.local

# Deploy
docker-compose up -d
```

### Step 3: Configure Domain & SSL
```bash
# Point DNS A record to your server IP

# Get SSL certificate
sudo certbot --nginx -d isa820.yourdomain.com

# Auto-renewal (usually automatic, but verify)
sudo certbot renew --dry-run
```

### Step 4: Firewall Setup
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Post-Deployment

### Verify Installation
1. Visit `http://your-domain.com`
2. Check browser console for errors
3. Test navigation between books
4. Verify Supabase connection in network tab

### Admin Panel
- Access at `/admin`
- Use for content management
- Upload media assets
- Manage knowledge base

### Monitoring
```bash
# Check logs
pm2 logs isa820

# Or with Docker
docker-compose logs -f isa820

# System resource usage
htop
```

---

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules/.cache
npm run build
```

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project status
- Verify RLS policies allow access

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Docker Issues
```bash
# Remove all containers
docker-compose down

# Fresh start
docker-compose up -d --force-recreate
```

### Permission Denied
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/ISA820
```

---

## Features Overview

### Voice Signatures
- **Gold** (👑): The Father speaking
- **Crimson** (🩸): The Son (Messiah) speaking
- **Silver** (✨): Angelic/Messenger voices

### Forensic Pillars
- **ISA 8:20**: The Standard (Law & Testimony)
- **DEUT 6:4**: The Identity (Hear O Israel)
- **Nature**: Dynamic manifestation indicator

### Components
- **BibleReader**: Manuscript-first display with Strong's links
- **VisualLibraryBrowser**: 66-book grid with drill-down navigation
- **ForensicSidebar**: AI-powered verse analysis
- **StrongsPanel**: Lexicon definitions & usage traces

---

## Support

For issues or questions:
1. Check this deployment guide
2. Review Supabase documentation
3. Check Next.js deployment docs

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-08
