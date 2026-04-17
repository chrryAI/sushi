#!/bin/bash
# =============================================================================
# Optuna Manager - CLI for hyperparameter tuning operations
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.optuna.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[Optuna Manager]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

# Commands
cmd_start() {
    log "Starting Optuna infrastructure..."
    
    # Create network if not exists
    docker network create vex-net 2>/dev/null || true
    
    # Start services
    docker compose -f "$COMPOSE_FILE" up -d
    
    success "Optuna infrastructure started!"
    echo ""
    echo "Dashboards:"
    echo "  - Optuna Dashboard: http://localhost:8080"
    echo "  - n8n:              http://localhost:5678"
    echo "  - MLflow:           http://localhost:5001"
}

cmd_stop() {
    log "Stopping Optuna infrastructure..."
    docker compose -f "$COMPOSE_FILE" down
    success "Optuna infrastructure stopped"
}

cmd_restart() {
    cmd_stop
    sleep 2
    cmd_start
}

cmd_scale() {
    local workers=${1:-4}
    log "Scaling trial workers to $workers..."
    docker compose -f "$COMPOSE_FILE" up -d --scale trial-worker=$workers
    success "Scaled to $workers workers"
}

cmd_status() {
    log "Checking Optuna status..."
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    
    # Check study status if optuna is running
    if docker ps | grep -q optuna-storage; then
        log "Study statistics:"
        docker exec optuna-db psql -U optuna -d optuna -c "
            SELECT study_name, direction, COUNT(t.trial_id) as trial_count
            FROM studies s
            LEFT JOIN trials t ON s.study_id = t.study_id
            GROUP BY study_name, direction;
        " 2>/dev/null || warn "Could not fetch study stats"
    fi
}

cmd_logs() {
    local service=${1:-trial-worker}
    docker compose -f "$COMPOSE_FILE" logs -f "$service"
}

cmd_optimize() {
    local study_name=${1:-agent-memory-optimizer}
    local n_trials=${2:-100}
    local n_workers=${3:-4}
    
    log "Starting optimization:"
    log "  Study: $study_name"
    log "  Trials: $n_trials"
    log "  Workers: $n_workers"
    
    # Export env vars
    export STUDY_NAME="$study_name"
    
    # Scale workers
    docker compose -f "$COMPOSE_FILE" up -d --scale trial-worker=$n_workers
    
    success "Optimization started with $n_workers workers!"
    warn "Monitor progress at: http://localhost:8080"
}

cmd_best() {
    local study_name=${1:-agent-memory-optimizer}
    
    log "Fetching best parameters for study: $study_name"
    
    docker exec optuna-db psql -U optuna -d optuna -c "
        WITH best_trial AS (
            SELECT t.trial_id, t.value, t.datetime_complete
            FROM trials t
            JOIN studies s ON t.study_id = s.study_id
            WHERE s.study_name = '$study_name'
            AND t.state = 'COMPLETE'
            ORDER BY t.value DESC
            LIMIT 1
        )
        SELECT 
            bt.trial_id,
            bt.value as best_score,
            tp.param_name,
            tp.param_value
        FROM best_trial bt
        JOIN trial_params tp ON bt.trial_id = tp.trial_id
        ORDER BY tp.param_name;
    " 2>/dev/null || error "Could not fetch best parameters"
}

cmd_report() {
    local study_name=${1:-agent-memory-optimizer}
    local output_file=${2:-optuna_report.html}
    
    log "Generating report for $study_name..."
    
    # Use optuna-dashboard to export
    docker run --rm \
        --network optuna-net \
        -v "$PWD:/output" \
        ghcr.io/optuna/optuna-dashboard:latest \
        optuna-dashboard "$OPTUNA_STORAGE" --export /output/"$output_file" \
        2>/dev/null || warn "Report generation requires optuna-storage to be running"
    
    success "Report saved to $output_file"
}

cmd_clean() {
    warn "This will delete all Optuna data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [[ $confirm == "yes" ]]; then
        docker compose -f "$COMPOSE_FILE" down -v
        success "All data cleaned"
    else
        log "Cancelled"
    fi
}

# Help
cmd_help() {
    cat << EOF
Optuna Manager - Hyperparameter Tuning CLI

Usage: $0 <command> [options]

Commands:
  start              Start Optuna infrastructure
  stop               Stop Optuna infrastructure
  restart            Restart all services
  status             Show status of all services
  scale <n>          Scale trial workers to n instances
  optimize [study] [trials] [workers]
                     Start optimization with specified parameters
  best [study]       Show best parameters for a study
  report [study] [file]
                     Generate HTML report
  logs [service]     Show logs (default: trial-worker)
  clean              Clean all data (DANGEROUS)
  help               Show this help

Examples:
  $0 start                           # Start infrastructure
  $0 scale 8                         # Scale to 8 workers
  $0 optimize my-study 1000 10       # Run 1000 trials with 10 workers
  $0 best                            # Show best params for default study
  $0 logs optuna-dashboard           # View dashboard logs

Dashboards:
  - Optuna: http://localhost:8080
  - n8n:    http://localhost:5678
  - MLflow: http://localhost:5001

Environment Variables:
  OPTUNA_DB_PASS     Database password
  OPENAI_API_KEY     For actual API trials
  STUDY_NAME         Default study name
EOF
}

# Main
case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    scale)
        cmd_scale "$2"
        ;;
    optimize)
        cmd_optimize "$2" "$3" "$4"
        ;;
    best)
        cmd_best "$2"
        ;;
    report)
        cmd_report "$2" "$3"
        ;;
    logs)
        cmd_logs "$2"
        ;;
    clean)
        cmd_clean
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        error "Unknown command: $1. Run '$0 help' for usage."
        ;;
esac
