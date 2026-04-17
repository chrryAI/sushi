#!/bin/bash
# =============================================================================
# Local Optuna Setup Script
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[Setup]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker Desktop first."
    fi
    success "Docker found"
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        error "Docker Compose not found. Please update Docker Desktop."
    fi
    success "Docker Compose found"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker Desktop."
    fi
    success "Docker is running"
}

# Setup environment
setup_env() {
    log "Setting up environment..."
    
    cd "$PROJECT_DIR"
    
    if [ ! -f .env.optuna ]; then
        cp .env.optuna.example .env.optuna
        warn "Created .env.optuna - please review and customize if needed"
    else
        success ".env.optuna already exists"
    fi
    
    # Source the env file
    set -a
    source .env.optuna 2>/dev/null || true
    set +a
}

# Start infrastructure
start_infrastructure() {
    log "Starting Optuna infrastructure..."
    
    cd "$PROJECT_DIR"
    
    # Pull images
    docker compose -f docker-compose.optuna.local.yml pull
    
    # Start services (without worker)
    docker compose -f docker-compose.optuna.local.yml up -d optuna-postgres optuna-dashboard optuna-redis-local
    
    # Wait for PostgreSQL
    log "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec optuna-postgres-local pg_isready -U optuna > /dev/null 2>&1; then
            success "PostgreSQL is ready"
            break
        fi
        sleep 1
    done
    
    success "Infrastructure started!"
}

# Check VEX DB connection
check_vex_db() {
    log "Checking VEX database connection..."
    
    VEX_URL="${VEX_DB_URL:-postgresql://postgres@host.docker.internal:5432/v}"
    
    # Try to connect from host
    if command -v psql &> /dev/null; then
        if psql "$VEX_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            success "VEX database is accessible from host"
            return 0
        fi
    fi
    
    warn "Could not connect to VEX database"
    warn "The optimizer will use synthetic data"
    warn "To connect to your real data:"
    warn "  1. Ensure PostgreSQL is running on localhost:5432"
    warn "  2. Update VEX_DB_URL in .env.optuna"
    
    return 1
}

# Run first trial
run_demo() {
    log "Running demo optimization (5 trials)..."
    
    cd "$PROJECT_DIR"
    
    # Build worker image
    docker compose -f docker-compose.optuna.local.yml build trial-worker-local
    
    # Run with limited trials
    docker run --rm \
        --network optuna-local \
        -e OPTUNA_STORAGE="$OPTUNA_STORAGE" \
        -e VEX_DB_URL="$VEX_DB_URL" \
        -e STUDY_NAME="demo-study" \
        -e TRIAL_MODE="mock" \
        -e WORKER_ID="demo" \
        optuna-trial-worker-local \
        python -c "
import optuna
from trial_worker_local import objective

study = optuna.create_study(
    study_name='demo-study',
    storage='$OPTUNA_STORAGE',
    direction='maximize',
    load_if_exists=True
)

print('Running 5 demo trials...')
study.optimize(objective, n_trials=5)

print(f'\\nBest score: {study.best_value:.3f}')
print('Best params:', study.best_params)
"
    
    success "Demo completed!"
}

# Show status
show_status() {
    log "Current status:"
    
    echo ""
    docker compose -f docker-compose.optuna.local.yml ps
    
    echo ""
    log "Dashboards:"
    echo "  Optuna Dashboard: http://localhost:8081"
    echo "  (View real-time optimization progress)"
    
    echo ""
    log "Useful commands:"
    echo "  View logs:     docker logs -f optuna-dashboard"
    echo "  Run worker:    docker compose -f docker-compose.optuna.local.yml --profile worker up -d"
    echo "  Stop all:      docker compose -f docker-compose.optuna.local.yml down"
}

# Main menu
main_menu() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         🧠 LOCAL OPTUNA SETUP                             ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    setup_env
    start_infrastructure
    check_vex_db
    
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "1) Run demo optimization (5 trials, synthetic data)"
    echo "2) Start full optimization worker"
    echo "3) View dashboards"
    echo "4) Exit"
    echo ""
    read -p "Select option [1-4]: " choice
    
    case $choice in
        1)
            run_demo
            show_status
            ;;
        2)
            log "Starting optimization worker..."
            cd "$PROJECT_DIR"
            docker compose -f docker-compose.optuna.local.yml --profile worker up -d
            success "Worker started!"
            show_status
            ;;
        3)
            show_status
            log "Opening dashboards..."
            echo "  → http://localhost:8081"
            ;;
        4)
            show_status
            log "Done!"
            ;;
        *)
            error "Invalid option"
            ;;
    esac
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.optuna.local.yml down -v
    success "Cleanup complete"
}

# Handle arguments
case "${1:-setup}" in
    setup)
        main_menu
        ;;
    demo)
        check_prerequisites
        setup_env
        start_infrastructure
        run_demo
        show_status
        ;;
    start)
        check_prerequisites
        setup_env
        start_infrastructure
        cd "$PROJECT_DIR"
        docker compose -f docker-compose.optuna.local.yml --profile worker up -d
        show_status
        ;;
    stop)
        cd "$PROJECT_DIR"
        docker compose -f docker-compose.optuna.local.yml down
        success "Stopped"
        ;;
    cleanup)
        cleanup
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 [setup|demo|start|stop|cleanup|status]"
        echo ""
        echo "Commands:"
        echo "  setup   - Interactive setup (default)"
        echo "  demo    - Run 5 trial demo"
        echo "  start   - Start infrastructure and worker"
        echo "  stop    - Stop all services"
        echo "  cleanup - Remove all data"
        echo "  status  - Show current status"
        ;;
esac
