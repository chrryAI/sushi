#!/usr/bin/env python3
"""
Optuna Trial Worker - Agent Memory & Performance Optimization

Bu worker, agent hyperparameter'larını optimize etmek için Optuna trial'ları çalıştırır.
Benchmark sonuçlarına dayanarak en iyi agent performansını bulur.

Hyperparameter Space:
    - context_window: 4k-32k tokens
    - temperature: 0.1-1.0
    - top_p: 0.1-1.0
    - max_tokens: 100-4000
    - presence_penalty: -2.0 to 2.0
    - frequency_penalty: -2.0 to 2.0
    - retrieval_k: 1-20 (RAG için)
    - summary_threshold: 10-100 mesaj
    
Objective Metrics:
    - ROUGE-1 Score (context recall)
    - ROUGE-L Score (fluency)
    - Response latency
    - Token efficiency
    - User satisfaction (implicit)
"""

import os
import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

import optuna
import psycopg2
import httpx
from optuna.samplers import TPESampler
from optuna.pruners import MedianPruner
from rouge_score import rouge_scorer
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPTUNA_STORAGE = os.getenv("OPTUNA_STORAGE", "postgresql://optuna:optuna@localhost:5432/optuna")
STUDY_NAME = os.getenv("STUDY_NAME", "agent-memory-optimizer")
API_URL = os.getenv("API_URL", "http://localhost:3002")
WORKER_ID = os.getenv("WORKER_ID", "1")
DB_URL = os.getenv("DB_URL", OPTUNA_STORAGE)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format=f"[Worker-{WORKER_ID}] %(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class TrialConfig:
    """Trial configuration for a single experiment"""
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


class AgentOptimizer:
    """Agent performance optimizer using Optuna"""
    
    def __init__(self):
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rougeL'], use_stemmer=True)
        self.db_conn = None
        self._connect_db()
    
    def _connect_db(self):
        """Connect to PostgreSQL"""
        try:
            self.db_conn = psycopg2.connect(DB_URL)
            logger.info("Connected to database")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_test_threads(self, limit: int = 10) -> list:
        """Fetch long threads for testing"""
        with self.db_conn.cursor() as cur:
            cur.execute("""
                SELECT "threadId", COUNT(*) as msg_count 
                FROM messages 
                WHERE "threadId" IS NOT NULL
                GROUP BY "threadId" 
                HAVING COUNT(*) >= 20 
                ORDER BY COUNT(*) DESC 
                LIMIT %s
            """, (limit,))
            return cur.fetchall()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_thread_messages(self, thread_id: str, limit: int = 50) -> list:
        """Fetch messages from a thread"""
        with self.db_conn.cursor() as cur:
            cur.execute("""
                SELECT content, "createdOn", "agentId", "userId"
                FROM messages 
                WHERE "threadId" = %s 
                ORDER BY "createdOn" ASC
                LIMIT %s
            """, (thread_id, limit))
            return cur.fetchall()
    
    def calculate_rouge_score(self, reference: str, candidate: str) -> Dict[str, float]:
        """Calculate ROUGE scores"""
        scores = self.rouge_scorer.score(reference, candidate)
        return {
            'rouge1_f': scores['rouge1'].fmeasure,
            'rouge1_p': scores['rouge1'].precision,
            'rouge1_r': scores['rouge1'].recall,
            'rougeL_f': scores['rougeL'].fmeasure,
        }
    
    def simulate_agent_response(
        self, 
        config: TrialConfig,
        context: str,
        question: str
    ) -> tuple[str, float]:
        """
        Simulate or call actual agent API
        Returns: (response_text, latency_ms)
        """
        start_time = time.time()
        
        # For now, simulate with context truncation based on config
        # In production, this would call your actual API
        context_words = context.split()
        max_words = config.context_window // 4  # Approximate tokens to words
        truncated_context = ' '.join(context_words[-max_words:])
        
        # Simulate response generation
        # Higher temperature = more creative but less coherent
        # Lower temperature = more conservative but more coherent
        
        # Simulate latency based on config
        base_latency = 500  # ms
        latency_factor = config.max_tokens / 1000
        latency = base_latency * latency_factor * (1 + config.temperature)
        
        # Generate a simulated response
        # Quality depends on context_window and temperature
        response = f"Based on the context provided: {truncated_context[:200]}..."
        
        actual_latency = (time.time() - start_time) * 1000 + latency
        
        return response, actual_latency
    
    def evaluate_trial(self, config: TrialConfig) -> Dict[str, float]:
        """
        Evaluate a single trial configuration
        Returns metrics dict
        """
        logger.info(f"Evaluating config: {config}")
        
        try:
            # Fetch test threads
            threads = self.fetch_test_threads(limit=5)
            
            if not threads:
                logger.warning("No test threads found")
                return {'rouge1_avg': 0.0, 'rougeL_avg': 0.0, 'latency_avg': 0.0}
            
            rouge1_scores = []
            rougeL_scores = []
            latencies = []
            
            for thread_id, msg_count in threads:
                # Fetch thread messages
                messages = self.fetch_thread_messages(thread_id, limit=config.summary_threshold + 10)
                
                if len(messages) < 5:
                    continue
                
                # Build context
                user_messages = [m for m in messages if m[3] is not None]  # userId not null
                agent_messages = [m for m in messages if m[2] is not None]  # agentId not null
                
                if not user_messages or not agent_messages:
                    continue
                
                # Use early messages as context, later as ground truth
                context_messages = messages[:len(messages)//2]
                ground_truth = ' '.join([m[0] for m in messages[len(messages)//2:] if m[0]])
                
                context = ' '.join([m[0] for m in context_messages if m[0]])
                
                # Simulate agent response
                question = "Summarize the conversation"
                response, latency = self.simulate_agent_response(config, context, question)
                
                # Calculate ROUGE scores
                if ground_truth and response:
                    scores = self.calculate_rouge_score(ground_truth, response)
                    rouge1_scores.append(scores['rouge1_f'])
                    rougeL_scores.append(scores['rougeL_f'])
                    latencies.append(latency)
            
            # Calculate averages
            avg_rouge1 = sum(rouge1_scores) / len(rouge1_scores) if rouge1_scores else 0.0
            avg_rougeL = sum(rougeL_scores) / len(rougeL_scores) if rougeL_scores else 0.0
            avg_latency = sum(latencies) / len(latencies) if latencies else 1000.0
            
            return {
                'rouge1_avg': avg_rouge1,
                'rougeL_avg': avg_rougeL,
                'latency_avg': avg_latency,
                'token_efficiency': config.context_window / max(avg_latency, 1)
            }
            
        except Exception as e:
            logger.error(f"Trial evaluation failed: {e}")
            return {'rouge1_avg': 0.0, 'rougeL_avg': 0.0, 'latency_avg': 10000.0}


def objective(trial: optuna.Trial) -> float:
    """
    Optuna objective function
    Returns composite score (higher is better)
    """
    # Define hyperparameter search space
    config = TrialConfig(
        context_window=trial.suggest_categorical('context_window', [4096, 8192, 16384, 32768]),
        temperature=trial.suggest_float('temperature', 0.1, 1.0),
        top_p=trial.suggest_float('top_p', 0.1, 1.0),
        max_tokens=trial.suggest_int('max_tokens', 100, 4000, log=True),
        presence_penalty=trial.suggest_float('presence_penalty', -2.0, 2.0),
        frequency_penalty=trial.suggest_float('frequency_penalty', -2.0, 2.0),
        retrieval_k=trial.suggest_int('retrieval_k', 1, 20),
        summary_threshold=trial.suggest_int('summary_threshold', 10, 100),
        use_rag=trial.suggest_categorical('use_rag', [True, False]),
        model_name=trial.suggest_categorical('model_name', ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku'])
    )
    
    logger.info(f"Starting trial {trial.number} with config: {config}")
    
    # Initialize optimizer
    optimizer = AgentOptimizer()
    
    # Evaluate configuration
    metrics = optimizer.evaluate_trial(config)
    
    # Calculate composite score
    # We want high ROUGE scores and low latency
    rouge_score = metrics['rouge1_avg'] * 0.6 + metrics['rougeL_avg'] * 0.4
    latency_penalty = min(metrics['latency_avg'] / 1000, 1.0)  # Normalize to 0-1
    
    # Composite score: higher ROUGE is better, lower latency is better
    composite_score = rouge_score * (1 - latency_penalty * 0.3)
    
    # Report intermediate values for pruning
    trial.report(rouge_score, step=1)
    
    if trial.should_prune():
        logger.info(f"Trial {trial.number} pruned")
        raise optuna.TrialPruned()
    
    logger.info(
        f"Trial {trial.number} completed: "
        f"ROUGE-1={metrics['rouge1_avg']:.4f}, "
        f"ROUGE-L={metrics['rougeL_avg']:.4f}, "
        f"Latency={metrics['latency_avg']:.2f}ms, "
        f"Score={composite_score:.4f}"
    )
    
    return composite_score


def main():
    """Main worker loop"""
    logger.info(f"Starting Optuna Trial Worker {WORKER_ID}")
    logger.info(f"Study: {STUDY_NAME}")
    logger.info(f"Storage: {OPTUNA_STORAGE}")
    
    # Create or load study
    study = optuna.create_study(
        study_name=STUDY_NAME,
        storage=OPTUNA_STORAGE,
        direction="maximize",
        sampler=TPESampler(n_startup_trials=10, n_ei_candidates=24),
        pruner=MedianPruner(n_startup_trials=5, n_warmup_steps=3),
        load_if_exists=True
    )
    
    logger.info(f"Study has {len(study.trials)} completed trials")
    
    if study.best_trial:
        logger.info(f"Current best score: {study.best_value:.4f}")
        logger.info(f"Best params: {study.best_params}")
    
    # Run optimization loop
    while True:
        try:
            study.optimize(objective, n_trials=1, catch=(Exception,))
            
            # Log progress
            logger.info(
                f"Completed {len(study.trials)} trials. "
                f"Best: {study.best_value:.4f if study.best_value else 'N/A'}"
            )
            
        except Exception as e:
            logger.error(f"Optimization error: {e}")
            time.sleep(10)  # Wait before retrying


if __name__ == "__main__":
    main()
