from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    'vc_use_tasks',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks']  # Import tasks module
)

# Configure Celery
celery_app.conf.update(
    # Max 4 tasks running in parallel (each uses 2 browsers = 8 browsers total)
    worker_concurrency=4,

    # Task execution settings
    task_acks_late=True,  # Acknowledge task after completion (safer for retries)
    worker_prefetch_multiplier=1,  # Only fetch 1 task at a time per worker

    # Retry settings
    task_default_retry_delay=60,  # Wait 60s before retry
    task_max_retries=3,

    # Result expiration
    result_expires=3600,  # Task results expire after 1 hour

    # Task time limits
    task_soft_time_limit=600,  # 10 minutes soft limit
    task_time_limit=900,  # 15 minutes hard limit

    # Serialization
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
)

if __name__ == '__main__':
    celery_app.start()
