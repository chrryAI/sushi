#!/usr/bin/env python3
"""
Local Optuna Trial Worker - Agent Memory Optimization

Local development için optimize edilmiş versiyon.
- Mock mod: API key olmadan simülasyon
- Real mod: Gerçek API çağrıları
- Doğrudan local VEX DB'ye bağlanır
"""

import os
import time
import logging
import random
from typing import Dict, Any
from dataclasses import dataclass

import optuna
import psycopg2
import psycopg2.pool
from optuna.samplers import TPESampler
from optuna.pruners import MedianPruner
from rouge_score import rouge_scorer
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPTUNA_STORAGE = os.getenv("OPTUNA_STORAGE", "postgresql://optuna:local_pass_123@localhost:5433/optuna")
STUDY_NAME = os.getenv("STUDY_NAME", "local-memory-optimizer")
VEX_DB_URL = os.getenv("VEX_DB_URL", "postgresql://postgres@host.docker.internal:5432/v")
TRIAL_MODE = os.getenv("TRIAL_MODE", "mock")  # 'mock' or 'real'
WORKER_ID = os.getenv("WORKER_ID", "local-1")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format=f"[Worker-{WORKER_ID}] %(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class TrialConfig:
    """Hyperparameter configuration"""
    context_window: int
    temperature: float
    top_p: float
    max_tokens: int
    presence_penalty: float
    frequency_penalty: float
    retrieval_k: int
    summary_threshold: int
    use_rag: bool
    model_name: str


class LocalAgentOptimizer:
    """Local optimizer with mock and real modes"""
    
    def __init__(self):
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rougeL'], use_stemmer=True)
        self.vex_db_pool = None
        self._connect_vex_db()
        
    def _connect_vex_db(self):
        """Connect to local VEX database"""
        try:
            # Try to connect, but don't fail if not available
            self.vex_db_pool = psycopg2.pool.SimpleConnectionPool(
                1, 5, VEX_DB_URL
            )
            conn = self.vex_db_pool.getconn()
            conn.cursor().execute("SELECT 1")
            self.vex_db_pool.putconn(conn)
            logger.info("Connected to VEX database")
        except Exception as e:
            logger.warning(f"VEX DB not available: {e}")
            logger.warning("Running in standalone mode with synthetic data")
            self.vex_db_pool = None
    
    def fetch_test_data(self, limit: int = 10) -> list:
        """Fetch test data from VEX or generate synthetic"""
        if not self.vex_db_pool:
            # Generate synthetic test data
            return self._generate_synthetic_data(limit)
        
        try:
            conn = self.vex_db_pool.getconn()
            cur = conn.cursor()
            
            # Fetch long threads
            cur.execute("""
                SELECT "threadId", COUNT(*) as msg_count 
                FROM messages 
                WHERE "threadId" IS NOT NULL
                GROUP BY "threadId" 
                HAVING COUNT(*) >= 15 
                ORDER BY COUNT(*) DESC 
                LIMIT %s
            """, (limit,))
            
            threads = cur.fetchall()
            self.vex_db_pool.putconn(conn)
            
            if threads:
                return threads
            return self._generate_synthetic_data(limit)
            
        except Exception as e:
            logger.warning(f"Failed to fetch from VEX: {e}")
            return self._generate_synthetic_data(limit)
    
    def _generate_synthetic_data(self, limit: int) -> list:
        """Generate synthetic thread data for testing"""
        logger.info("Generating synthetic test data")
        data = []
        for i in range(limit):
            thread_id = f"synthetic-thread-{i}"
            msg_count = random.randint(15, 80)
            data.append((thread_id, msg_count))
        return data
    
    def fetch_thread_messages(self, thread_id: str) -> list:
        """Fetch messages or generate synthetic"""
        if not self.vex_db_pool or thread_id.startswith("synthetic"):
            return self._generate_synthetic_messages(thread_id)
        
        try:
            conn = self.vex_db_pool.getconn()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT content, "agentId", "userId"
                FROM messages 
                WHERE "threadId" = %s 
                ORDER BY "createdOn" ASC
                LIMIT 50
            """, (thread_id,))
            
            messages = cur.fetchall()
            self.vex_db_pool.putconn(conn)
            
            return messages if messages else self._generate_synthetic_messages(thread_id)
            
        except Exception as e:
            logger.warning(f"Failed to fetch messages: {e}")
            return self._generate_synthetic_messages(thread_id)
    
    def _generate_synthetic_messages(self, thread_id: str) -> list:
        """Generate realistic synthetic conversation"""
        topics = [
            "machine learning optimization",
            "database performance tuning",
            "API design patterns",
            "cloud infrastructure",
            "microservices architecture",
            "data pipeline design"
        ]
        
        topic = random.choice(topics)
        messages = []
        
        # Generate user and agent messages
        for i in range(random.randint(15, 40)):
            if i % 2 == 0:
                # User message
                content = f"Question about {topic}: How do I optimize {random.choice(['latency', 'throughput', 'memory', 'CPU'])}?"
                messages.append((content, None, f"user-{i}"))
            else:
                # Agent message
                content = f"Based on your question about {topic}, I recommend analyzing the {random.choice(['bottlenecks', 'metrics', 'logs', 'traces'])}."
                messages.append((content, f"agent-{i}", None))
        
        return messages
    
    def simulate_or_call_api(self, config: TrialConfig, context: str, question: str) -> tuple:
        """Either simulate response or call real API"""
        start_time = time.time()
        
        if TRIAL_MODE == "mock":
            # Mock mode: Simulate based on config
            context_words = context.split()
            max_words = min(len(context_words), config.context_window // 4)
            
            # Simulate quality based on config
            base_quality = 0.3
            if config.context_window >= 8192:
                base_quality += 0.2
            if config.temperature < 0.5:
                base_quality += 0.15
            if config.use_rag:
                base_quality += 0.1
            if config.retrieval_k >= 5:
                base_quality += 0.05
            
            # Add some noise
            quality = min(0.95, base_quality + random.uniform(-0.1, 0.1))
            
            # Generate response
            response_words = int(config.max_tokens / 4 * quality)
            response = " ".join(context_words[:response_words]) if context_words else "No context available"
            
            # Simulate latency
            latency = 200 + (config.max_tokens / 10) + random.uniform(0, 100)
            
        else:
            # Real API mode - would call actual API
            # TODO: Implement actual API call
            logger.warning("Real API mode not yet implemented, falling back to mock")
            return self.simulate_or_call_api(config, context, question)
        
        actual_latency = (time.time() - start_time) * 1000 + latency
        return response, actual_latency, quality
    
    def evaluate_config(self, config: TrialConfig) -> Dict[str, float]:
        """Evaluate a hyperparameter configuration"""
        logger.info(f"Evaluating: {config}")
        
        # Fetch test data
        threads = self.fetch_test_data(limit=5)
        
        rouge1_scores = []
        rougeL_scores = []
        latencies = []
        
        for thread_id, msg_count in threads:
            messages = self.fetch_thread_messages(thread_id)
            
            if len(messages) < 5:
                continue
            
            # Split into context and ground truth
            split_point = len(messages) // 2
            context_msgs = messages[:split_point]
            truth_msgs = messages[split_point:]
            
            context = " ".join([m[0] for m in context_msgs if m[0]])
            ground_truth = " ".join([m[0] for m in truth_msgs if m[0]])
            
            if not context or not ground_truth:
                continue
            
            # Get response
            question = "Summarize and respond to the conversation"
            response, latency, _ = self.simulate_or_call_api(config, context, question)
            
            # Calculate ROUGE
            if len(ground_truth) > 10 and len(response) > 10:
                scores = self.rouge_scorer.score(ground_truth, response)
                rouge1_scores.append(scores['rouge1'].fmeasure)
                rougeL_scores.append(scores['rougeL'].fmeasure)
                latencies.append(latency)
        
        # Calculate averages
        avg_rouge1 = sum(rouge1_scores) / len(rouge1_scores) if rouge1_scores else 0.0
        avg_rougeL = sum(rougeL_scores) / len(rougeL_scores) if rougeL_scores else 0.0
        avg_latency = sum(latencies) / len(latencies) if latencies else 1000.0
        
        return {
            'rouge1': avg_rouge1,
            'rougeL': avg_rougeL,
            'latency': avg_latency
        }


def objective(trial: optuna.Trial) -> float:
    """Optuna objective function"""
    
    # Define search space based on our benchmark findings
    config = TrialConfig(
        context_window=trial.suggest_categorical('context_window', [4096, 8192, 16384]),
        temperature=trial.suggest_float('temperature', 0.1, 0.8),
        top_p=trial.suggest_float('top_p', 0.5, 1.0),
        max_tokens=trial.suggest_int('max_tokens', 200, 2000, log=True),
        presence_penalty=trial.suggest_float('presence_penalty', -1.0, 1.0),
        frequency_penalty=trial.suggest_float('frequency_penalty', -1.0, 1.0),
        retrieval_k=trial.suggest_int('retrieval_k', 3, 15),
        summary_threshold=trial.suggest_int('summary_threshold', 10, 50),
        use_rag=trial.suggest_categorical('use_rag', [True, False]),
        model_name=trial.suggest_categorical('model_name', ['gpt-4o-mini', 'gpt-4o'])
    )
    
    optimizer = LocalAgentOptimizer()
    metrics = optimizer.evaluate_config(config)
    
    # Composite score (higher is better)
    # Weight: ROUGE-1 (60%), ROUGE-L (30%), Latency penalty (10%)
    rouge_score = metrics['rouge1'] * 0.6 + metrics['rougeL'] * 0.3
    latency_penalty = min(metrics['latency'] / 1000, 1.0) * 0.1
    
    composite = rouge_score - latency_penalty
    
    # Report for pruning
    trial.report(rouge_score, step=1)
    if trial.should_prune():
        raise optuna.TrialPruned()
    
    logger.info(
        f"Trial {trial.number}: "
        f"ROUGE-1={metrics['rouge1']:.3f}, "
        f"ROUGE-L={metrics['rougeL']:.3f}, "
        f"Latency={metrics['latency']:.0f}ms, "
        f"Score={composite:.3f}"
    )
    
    return composite


def main():
    """Main worker loop"""
    logger.info(f"🚀 Starting Local Optuna Worker")
    logger.info(f"Mode: {TRIAL_MODE}")
    logger.info(f"Study: {STUDY_NAME}")
    logger.info(f"VEX DB: {VEX_DB_URL if 'localhost' not in VEX_DB_URL else 'Not configured'}")
    
    # Create or load study
    study = optuna.create_study(
        study_name=STUDY_NAME,
        storage=OPTUNA_STORAGE,
        direction="maximize",
        sampler=TPESampler(n_startup_trials=10),
        pruner=MedianPruner(n_startup_trials=5),
        load_if_exists=True
    )
    
    logger.info(f"Study has {len(study.trials)} completed trials")
    
    if study.best_trial:
        logger.info(f"Current best: {study.best_value:.3f}")
        logger.info(f"Best params: {study.best_params}")
    
    # Run trials
    logger.info("Starting optimization loop...")
    try:
        study.optimize(objective, n_trials=50, catch=(Exception,))
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    
    # Final report
    logger.info("\n" + "="*60)
    logger.info("OPTIMIZATION COMPLETE")
    logger.info("="*60)
    
    if study.best_trial:
        logger.info(f"Best Score: {study.best_value:.3f}")
        logger.info("Best Parameters:")
        for key, value in study.best_params.items():
            logger.info(f"  {key}: {value}")
    
    logger.info(f"\nView dashboard: http://localhost:8081")


if __name__ == "__main__":
    main()
