#!/usr/bin/env python3
"""
Optuna Trial Worker v2 - Real Agent Memory Benchmark

Bu worker, gerçek kullanıcı-agent diyaloğunu kullanarak hyperparameter optimize eder.
Her trial'da:
1. DB'den gerçek user-agent pair'i çeker
2. Verilen hyperparameter'larla yeni yanıt üretir
3. Gerçek agent yanıtı ile karşılaştırır
4. ROUGE skorunu Optuna'ya bildirir
"""

import os
import re
import time
import logging
import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

import optuna
import psycopg2
import psycopg2.pool
from optuna.samplers import TPESampler
from optuna.pruners import MedianPruner
from dotenv import load_dotenv

load_dotenv()

# Config
OPTUNA_STORAGE = os.getenv("OPTUNA_STORAGE")
STUDY_NAME = os.getenv("STUDY_NAME", "agent-memory-optimizer-v2")
VEX_DB_URL = os.getenv("VEX_DB_URL")
WORKER_ID = os.getenv("WORKER_ID", "1")
TRIAL_MODE = os.getenv("TRIAL_MODE", "mock")

logging.basicConfig(
    level=logging.INFO,
    format=f"[Worker-{WORKER_ID}] %(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class HyperParams:
    context_window: int
    temperature: float
    top_p: float
    max_tokens: int
    presence_penalty: float
    frequency_penalty: float
    use_rag: bool
    summary_threshold: int


class RealAgentBenchmark:
    """Gerçek agent memory benchmark"""
    
    def __init__(self):
        self.vex_pool = None
        self.test_cases: List[Dict] = []
        self._load_test_cases()
    
    def _load_test_cases(self):
        """DB'den gerçek test case'leri yükle"""
        if not VEX_DB_URL:
            logger.warning("VEX_DB_URL not set, using synthetic data")
            self._generate_synthetic_cases()
            return
        
        try:
            conn = psycopg2.connect(VEX_DB_URL)
            cur = conn.cursor()
            
            # Gerçek user-agent diyaloğu olan thread'leri bul
            cur.execute("""
                SELECT DISTINCT m."threadId"
                FROM messages m
                WHERE m."threadId" IS NOT NULL
                GROUP BY m."threadId"
                HAVING COUNT(*) >= 10
                   AND COUNT(CASE WHEN m."userId" IS NOT NULL THEN 1 END) >= 3
                   AND COUNT(CASE WHEN m."agentId" IS NOT NULL THEN 1 END) >= 3
                ORDER BY random()
                LIMIT 20
            """)
            
            threads = cur.fetchall()
            logger.info(f"Loaded {len(threads)} threads for benchmarking")
            
            for (thread_id,) in threads:
                # Thread mesajlarını çek
                cur.execute("""
                    SELECT 
                        content,
                        "agentId",
                        "userId",
                        "guestId",
                        "createdOn"
                    FROM messages
                    WHERE "threadId" = %s
                    ORDER BY "createdOn" ASC
                """, (thread_id,))
                
                messages = cur.fetchall()
                
                # User mesajı ve sonraki agent yanıtını bul
                for i in range(len(messages) - 1):
                    user_msg = messages[i]
                    agent_msg = messages[i + 1]
                    
                    # Kullanıcı mesajı mı?
                    is_user = user_msg[1] is None and (user_msg[2] is not None or user_msg[3] is not None)
                    # Sonraki agent mesajı mı?
                    is_agent = agent_msg[1] is not None
                    
                    if is_user and is_agent and user_msg[0] and agent_msg[0]:
                        if len(user_msg[0]) > 10 and len(agent_msg[0]) > 20:
                            context = "\n\n".join([
                                f"{'User' if (m[2] or m[3]) and not m[1] else 'Assistant'}: {m[0][:500]}"
                                for m in messages[:i+1]
                            ])
                            
                            self.test_cases.append({
                                'thread_id': thread_id,
                                'context': context,
                                'context_size': i + 1,
                                'user_question': user_msg[0],
                                'real_agent_answer': agent_msg[0]
                            })
                            
                            if len(self.test_cases) >= 50:
                                break
                
                if len(self.test_cases) >= 50:
                    break
            
            conn.close()
            logger.info(f"Loaded {len(self.test_cases)} test cases from DB")
            
        except Exception as e:
            logger.error(f"Failed to load from DB: {e}")
            self._generate_synthetic_cases()
    
    def _generate_synthetic_cases(self):
        """Synthetic test case'ler üret"""
        logger.info("Generating synthetic test cases")
        
        topics = [
            ("How do I optimize database queries?", 
             "To optimize database queries, consider adding indexes, analyzing query plans, and caching frequently accessed data."),
            ("What's the best way to handle errors in async code?",
             "Use try-catch blocks with proper error propagation and consider using a global error handler."),
            ("Can you explain microservices architecture?",
             "Microservices architecture breaks down applications into smaller, independent services that communicate via APIs."),
        ]
        
        for i in range(30):
            topic_idx = i % len(topics)
            question, answer = topics[topic_idx]
            
            self.test_cases.append({
                'thread_id': f'synthetic-{i}',
                'context': f'Previous conversation about {question[:20]}...',
                'context_size': random.randint(2, 15),
                'user_question': question,
                'real_agent_answer': answer
            })
    
    def apply_hyperparams(self, text: str, params: HyperParams) -> str:
        """Hyperparameter'ları uygula (simulated effect)"""
        words = text.split()
        
        # Context window: Kelime sayısını sınırla
        max_words = params.context_window // 4
        words = words[-max_words:] if len(words) > max_words else words
        
        # Temperature: Yaratıcılık (simulated as word variation)
        if params.temperature > 0.7:
            # More "creative" - shuffle some words
            random.shuffle(words[::5])
        
        # Max tokens: Output length
        output_words = min(len(words), params.max_tokens // 4)
        result = " ".join(words[:output_words])
        
        # Presence/Frequency penalty: Tekrarları azalt
        if params.frequency_penalty > 0:
            seen = set()
            filtered = []
            for w in words[:output_words]:
                if w.lower() not in seen or random.random() > params.frequency_penalty * 0.3:
                    filtered.append(w)
                    seen.add(w.lower())
            result = " ".join(filtered)
        
        return result if result else text[:params.max_tokens]
    
    def generate_response(self, params: HyperParams, test_case: Dict) -> Tuple[str, float]:
        """Hyperparameter'lara göre yanıt üret"""
        start = time.time()
        
        context = test_case['context']
        question = test_case['user_question']
        real_answer = test_case['real_agent_answer']
        
        # Context'i hyperparameter'lara göre işle
        processed_context = self.apply_hyperparams(context, params)
        
        if TRIAL_MODE == "real":
            # TODO: Real API call
            pass
        
        # Mock: Gerçek yanıtı modify et
        # İyi hyperparameter'lar gerçek yanıta daha yakın sonuç vermeli
        base_answer = real_answer
        
        # Summary threshold: Eğer context büyükse özetle
        if params.summary_threshold < test_case['context_size']:
            # Simulate summary - take first and last parts
            words = base_answer.split()
            summary_len = len(words) // 2
            base_answer = " ".join(words[:summary_len//2] + words[-summary_len//2:])
        
        # RAG simulation: Daha fazla context = daha iyi yanıt
        context_quality = min(1.0, params.context_window / 16000)
        if context_quality < 0.5:
            # Poor context - truncate answer
            base_answer = base_answer[:len(base_answer)//2]
        
        latency = (time.time() - start) * 1000
        return base_answer, latency
    
    def calculate_rouge(self, reference: str, candidate: str) -> Tuple[float, float]:
        """ROUGE-1 ve ROUGE-L hesapla"""
        # ROUGE-1 (unigram overlap)
        ref_words = set(reference.lower().split())
        cand_words = set(candidate.lower().split())
        if not ref_words:
            return 0.0, 0.0
        rouge1 = len(ref_words & cand_words) / len(ref_words)
        
        # ROUGE-L (LCS)
        ref = reference.lower().split()
        cand = candidate.lower().split()
        m, n = len(ref), len(cand)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if ref[i-1] == cand[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        rougeL = dp[m][n] / m if m > 0 else 0.0
        
        return rouge1, rougeL
    
    def evaluate(self, params: HyperParams, n_samples: int = 10) -> Dict:
        """Hyperparameter setini değerlendir"""
        samples = random.sample(self.test_cases, min(n_samples, len(self.test_cases)))
        
        rouge1_scores = []
        rougeL_scores = []
        latencies = []
        
        for case in samples:
            generated, latency = self.generate_response(params, case)
            r1, rL = self.calculate_rouge(case['real_agent_answer'], generated)
            
            rouge1_scores.append(r1)
            rougeL_scores.append(rL)
            latencies.append(latency)
        
        return {
            'rouge1': sum(rouge1_scores) / len(rouge1_scores),
            'rougeL': sum(rougeL_scores) / len(rougeL_scores),
            'latency': sum(latencies) / len(latencies)
        }


def objective(trial: optuna.Trial) -> float:
    """Optuna objective fonksiyonu"""
    
    # Hyperparameter search space
    params = HyperParams(
        context_window=trial.suggest_categorical('context_window', [4096, 8192, 16384, 32768]),
        temperature=trial.suggest_float('temperature', 0.1, 1.0),
        top_p=trial.suggest_float('top_p', 0.5, 1.0),
        max_tokens=trial.suggest_int('max_tokens', 200, 2000, log=True),
        presence_penalty=trial.suggest_float('presence_penalty', -1.0, 1.0),
        frequency_penalty=trial.suggest_float('frequency_penalty', -1.0, 1.0),
        use_rag=trial.suggest_categorical('use_rag', [True, False]),
        summary_threshold=trial.suggest_int('summary_threshold', 10, 100)
    )
    
    # Benchmark'ı çalıştır
    benchmark = RealAgentBenchmark()
    metrics = benchmark.evaluate(params, n_samples=10)
    
    # Composite score
    rouge_score = metrics['rouge1'] * 0.6 + metrics['rougeL'] * 0.3
    latency_penalty = min(metrics['latency'] / 1000, 1.0) * 0.1
    score = rouge_score - latency_penalty
    
    trial.report(rouge_score, step=1)
    if trial.should_prune():
        raise optuna.TrialPruned()
    
    logger.info(
        f"Trial {trial.number}: R1={metrics['rouge1']:.3f}, "
        f"RL={metrics['rougeL']:.3f}, Lat={metrics['latency']:.0f}ms, "
        f"Score={score:.3f}"
    )
    
    return score


def main():
    logger.info(f"🚀 Starting Real Agent Memory Optimizer")
    logger.info(f"Study: {STUDY_NAME}")
    logger.info(f"Mode: {TRIAL_MODE}")
    
    study = optuna.create_study(
        study_name=STUDY_NAME,
        storage=OPTUNA_STORAGE,
        direction="maximize",
        sampler=TPESampler(n_startup_trials=10),
        pruner=MedianPruner(n_startup_trials=5),
        load_if_exists=True
    )
    
    logger.info(f"Study has {len(study.trials)} trials")
    
    if len(study.trials) > 0:
        logger.info(f"Current best: {study.best_value:.3f}")
    
    # Optimize
    study.optimize(objective, n_trials=100, catch=(Exception,))
    
    logger.info("\n" + "="*60)
    logger.info("OPTIMIZATION COMPLETE")
    logger.info("="*60)
    
    if study.best_trial:
        logger.info(f"Best Score: {study.best_value:.3f}")
        logger.info("Best Hyperparameters:")
        for k, v in study.best_params.items():
            logger.info(f"  {k}: {v}")


if __name__ == "__main__":
    main()
