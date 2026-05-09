#!/bin/bash
# ISA820 Deployment Script
# Run this after uploading files to your KVM server

set -e

echo "=========================================="
echo "ISA820 Deployment"
echo "=========================================="

# Configuration
APP_DIR="/var/www/isa820"
DOMAIN="isa820.yourdomain.com"  # CHANGE THIS

# Check environment file
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo "Error: .env.local not found!"
    echo "Please create it with your Supabase credentials"
    exit 1
fi

cd $APP_DIR

echo "Building Docker image..."
docker-compose build

echo "Starting containers..."
docker-compose up -d

echo "Waiting for app to be ready..."
sleep 10

echo "Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/isa820
sudo sed -i "s/isa820.yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/isa820
sudo ln -sf /etc/nginx/sites-available/isa820 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo "App: http://localhost:3000"
echo "Nginx: http://localhost (or $DOMAIN)"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f    # View logs"
echo "  docker-compose down       # Stop"
echo "  docker-compose up -d      # Restart"
