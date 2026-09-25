# AI-Based Resume & Job Matching System

A lightweight, machine learning-driven Flask application that parses PDF resumes, extracts candidate details and skills, predicts job roles, and recommends matching jobs with comprehensive skill gap analysis.

## Features

- **In-Memory PDF Parsing (`modules/parser.py`)**: Uses `pdfplumber` to extract clean resume text without persisting files to disk.
- **Information Extraction (`modules/extractor.py`)**:
  - Regular expressions for email and phone numbers.
  - Degree identification across common university qualifications.
  - High-performance skill phrase matching using `spacy.blank("en")` with `PhraseMatcher` against a 180+ skill dictionary.
- **Role Classification (`modules/classifier.py`)**:
  - Scikit-learn Pipeline with `TfidfVectorizer` and `LogisticRegression`.
  - Stratified 80/20 train/test evaluation with synthetic dataset fallback.
- **Semantic & Skill Gap Matching (`modules/matcher.py` & `modules/recommender.py`)**:
  - Dense semantic embeddings via `sentence-transformers` (`all-MiniLM-L6-v2`) with automatic TF-IDF fallback.
  - Combined scoring: 60% semantic similarity + 40% skill overlap.
  - Categorizes skills into matched and missing requirements.
- **REST API & Web UI (`app.py` & `templates/index.html`)**:
  - Single-page frontend with responsive drag-and-drop file upload.
  - Real-time role prediction confidence indicator and match percentage cards.

## Setup & Execution

### 1. Create Virtual Environment and Install Dependencies
```bash
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Train the Role Classifier
```bash
python train.py
```
*Note: If `data/resumes.csv` is not provided, `train.py` automatically generates synthetic resumes from `data/jobs.csv` as per SRS specification.*

### 3. Start the Flask Server
```bash
python app.py
```
Open your browser and navigate to `http://127.0.0.1:5000`.

## API Endpoints

- `GET /`: Serves the web frontend.
- `GET /api/health`: Health status check (`{"status": "ok"}`).
- `GET /api/jobs`: Returns the catalogue of available jobs and required skills.
- `POST /api/analyze`: Multipart form upload with field `resume` (PDF, max 5 MB).
