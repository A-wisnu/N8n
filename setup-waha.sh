#!/bin/bash

# WAHA WhatsApp Bot Setup Script
# This script sets up and starts the WAHA-based WhatsApp bot system

set -e

echo "🚀 WAHA WhatsApp Bot Setup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Installing via NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
}

# Create environment file if it doesn't exist
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        
        print_warning "Please edit .env file with your configuration:"
        echo "- WAHA_API_KEY: Set a secure API key"
        echo "- ADMIN_NUMBERS: Add your WhatsApp admin numbers"
        echo "- N8N_WEBHOOK_URL: Add your n8n webhook URL if using"
        echo "- GOOGLE_SHEETS_ID: Add your Google Sheets ID if using"
        
        read -p "Press Enter to continue after editing .env file..."
    else
        print_success ".env file already exists"
    fi
}

# Install Node.js dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Pull Docker images
pull_docker_images() {
    print_status "Pulling Docker images..."
    docker compose pull
    print_success "Docker images pulled successfully"
}

# Start services
start_services() {
    print_status "Starting WAHA services..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start services
    docker compose up -d
    
    print_success "Services started successfully"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    check_service_health
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check WAHA service
    if curl -s http://localhost:3000/api/version > /dev/null; then
        print_success "WAHA service is healthy"
    else
        print_warning "WAHA service might not be ready yet"
    fi
    
    # Check webhook service
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Webhook service is healthy"
    else
        print_warning "Webhook service might not be ready yet"
    fi
}

# Run tests
run_tests() {
    print_status "Running integration tests..."
    
    # Wait a bit more for services to be fully ready
    sleep 5
    
    if node tests/test-waha-integration.js; then
        print_success "Integration tests completed"
    else
        print_warning "Some tests failed - check the output above"
    fi
}

# Show service URLs
show_urls() {
    echo ""
    print_success "WAHA WhatsApp Bot is now running!"
    echo ""
    echo "📡 Service URLs:"
    echo "   WAHA Dashboard: http://localhost:3000/dashboard"
    echo "   WAHA Swagger:   http://localhost:3000/swagger"
    echo "   Webhook API:    http://localhost:3001/health"
    echo ""
    echo "🔑 Default credentials (change in .env):"
    echo "   Username: admin"
    echo "   Password: admin"
    echo "   API Key:  admin"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Open WAHA Dashboard: http://localhost:3000/dashboard"
    echo "   2. Start a WhatsApp session"
    echo "   3. Scan QR code with your phone"
    echo "   4. Test message sending via API"
    echo ""
    echo "📚 API Documentation: http://localhost:3000/swagger"
    echo ""
}

# Show logs
show_logs() {
    echo "📊 To view logs:"
    echo "   docker compose logs -f waha"
    echo "   docker compose logs -f masjid-bot"
    echo "   docker compose logs -f masjid-server"
    echo ""
    echo "🛑 To stop services:"
    echo "   docker compose down"
    echo ""
}

# Main execution
main() {
    echo ""
    check_docker
    check_nodejs
    setup_environment
    install_dependencies
    pull_docker_images
    start_services
    
    # Ask if user wants to run tests
    echo ""
    read -p "Do you want to run integration tests? (y/N): " run_test
    if [[ $run_test =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    show_urls
    show_logs
    
    print_success "Setup completed successfully! 🎉"
}

# Trap to handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@"