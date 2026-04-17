-- Initialize Optuna and n8n databases

-- Optuna database already created by docker
-- n8n database
CREATE DATABASE n8n;

-- MLflow database
CREATE DATABASE mlflow;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE n8n TO optuna;
GRANT ALL PRIVILEGES ON DATABASE mlflow TO optuna;

-- Create extensions for better performance
\c optuna
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\c n8n
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
