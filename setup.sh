#!/bin/bash
# ISA820 Production Setup Script
# Run on your KVM server after copying files

set -e

echo "=========================================="
echo "ISA820 Production Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}[1/7] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}[2/7] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version

echo -e "${GREEN}[3/7] Installing Docker...${NC}"
curl -fsSL https://get.docker.com | sh
usermod -aG docker www-data

echo -e "${GREEN}[4/7] Installing Nginx & Certbot...${NC}"
apt install -y nginx certbot python3-certbot-nginx

echo -e "${GREEN}[5/7] Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}[6/7] Creating www directory...${NC}"
mkdir -p /var/www/isa820
chown -R www-data:www-data /var/www

echo -e "${GREEN}[7/7] Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy ISA820 files to /var/www/isa820/"
echo "2. Configure environment:"
echo "   cp .env.example .env.local"
echo "   nano .env.local"
echo "3. Build and run:"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}Or for non-Docker deployment:${NC}"
echo "   npm install"
echo "   npm run build"
echo "   pm2 start npm --name 'isa820' -- start"
echo ""
echo -e "${GREEN}==========================================${NC}"
