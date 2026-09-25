"""Configuration settings and constants for the Resume & Job Matching System."""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
TEMPLATES_DIR = BASE_DIR / "templates"

# Data paths
RESUMES_CSV = DATA_DIR / "resumes.csv"
JOBS_CSV = DATA_DIR / "jobs.csv"
SKILLS_TXT = DATA_DIR / "skills.txt"

# Model paths
ROLE_CLASSIFIER_PATH = MODELS_DIR / "role_classifier.pkl"

# Model settings
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
USE_EMBEDDINGS = True  # Set to False to force TF-IDF fallback for semantic matching
TOP_N_RECOMMENDATIONS = 5

# Flask settings
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB maximum file upload size
ALLOWED_EXTENSIONS = {"pdf"}
HOST = "127.0.0.1"
PORT = 5000
DEBUG = False
