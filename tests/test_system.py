"""Comprehensive test suite covering all modules, edge cases, and SRS specifications."""

import io
import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from modules import parser, extractor, classifier, matcher, recommender
from app import app


# Minimal valid PDF binary helper
SAMPLE_PDF_BYTES = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 260 >> stream
BT
/F1 12 Tf
72 700 Td
(Candidate Name: John Doe) Tj
0 -20 Td
(Email: john.doe@example.com Phone: +91 9876543210) Tj
0 -20 Td
(Education: Bachelor of Technology B.Tech in CSE 2018-2022) Tj
0 -20 Td
(Technical Skills: Python, Flask, Docker, SQL, PostgreSQL, Git, Machine Learning) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
618
%%EOF"""


# ==========================================
# 1. PARSER MODULE TESTS (FR-1)
# ==========================================
def test_parser_valid_pdf():
    """Verify text is extracted from a valid PDF."""
    stream = io.BytesIO(SAMPLE_PDF_BYTES)
    text = parser.extract_text(stream)
    assert "John Doe" in text
    assert "john.doe@example.com" in text
    assert "Python" in text


def test_parser_corrupt_pdf():
    """Verify corrupted / non-PDF data raises ValueError as required by SRS."""
    stream = io.BytesIO(b"Not a valid PDF header")
    with pytest.raises(ValueError, match="Could not extract text from PDF"):
        parser.extract_text(stream)


def test_parser_empty_pdf():
    """Verify empty PDF raises ValueError."""
    stream = io.BytesIO(b"")
    with pytest.raises(ValueError, match="Could not extract text from PDF"):
        parser.extract_text(stream)


# ==========================================
# 2. EXTRACTOR MODULE TESTS (FR-2)
# ==========================================
def test_extractor_info_extraction():
    """Verify contact info, education, and skills extraction."""
    sample_text = """
    Jane Smith
    Email: jane.smith@techcorp.io
    Phone: +1 (555) 234-5678
    Experience: 2019-2023 Senior Engineer
    Education:
    Master of Science (M.Sc) in Artificial Intelligence
    Bachelor of Technology (B.Tech) in Computer Science

    Skills:
    Python, PyTorch, Docker, Kubernetes, AWS, Machine Learning, Deep Learning, SQL
    """
    info = extractor.extract_info(sample_text)

    assert info["email"] == "jane.smith@techcorp.io"
    assert info["phone"] == "+1 (555) 234-5678"
    assert len(info["education"]) == 2
    assert any("m.sc" in edu.lower() for edu in info["education"])
    assert any("b.tech" in edu.lower() for edu in info["education"])

    expected_skills = ["python", "pytorch", "docker", "kubernetes", "aws", "machine learning", "deep learning", "sql"]
    for s in expected_skills:
        assert s in info["skills"], f"Skill '{s}' missing from extracted skills"

    # Verify skills are unique, lowercase, and sorted
    assert info["skills"] == sorted(list(set(info["skills"])))
    assert all(s.islower() for s in info["skills"])


def test_extractor_phone_edge_cases():
    """Ensure date ranges (e.g. 2018-2022) are not falsely parsed as phone numbers."""
    text_with_dates = "Attended Akal University from 2018-2022. No contact number provided."
    info = extractor.extract_info(text_with_dates)
    assert info["phone"] is None


def test_extractor_scrum_master_not_education():
    """Ensure professional titles like 'Scrum Master' are not extracted as university degrees."""
    text = "John is an Agile Practitioner and Certified Scrum Master.\nEducation: B.Tech in IT"
    info = extractor.extract_info(text)
    assert len(info["education"]) == 1
    assert "scrum master" not in info["education"][0].lower()


def test_extractor_empty_text():
    """Ensure empty text returns structured dictionary safely."""
    info = extractor.extract_info("")
    assert info == {"email": None, "phone": None, "education": [], "skills": []}


# ==========================================
# 3. CLASSIFIER MODULE TESTS (FR-3)
# ==========================================
def test_clean_text():
    """Verify text cleaning removes URLs, punctuation, and extra whitespace."""
    raw = "Visit https://example.com/profile! Python & Flask developer... Email: test@test.com"
    cleaned = classifier.clean_text(raw)
    assert "https" not in cleaned
    assert "example com" not in cleaned
    assert "!" not in cleaned
    assert "&" not in cleaned
    assert "python" in cleaned
    assert "flask developer" in cleaned


def test_classifier_prediction():
    """Verify role prediction returns category and probability between 0 and 1."""
    text = "Extensive experience in Python, Django, Flask, PostgreSQL, building REST microservices."
    role, confidence = classifier.predict_role(text)
    assert isinstance(role, str)
    assert len(role) > 0
    assert 0.0 <= confidence <= 1.0


# ==========================================
# 4. MATCHER & RECOMMENDER TESTS (FR-4 & FR-5)
# ==========================================
def test_matcher_and_recommender():
    """Verify semantic scoring, skill overlap, and top_n ranking formula."""
    jobs_df = pd.read_csv(config.JOBS_CSV)
    job_embeddings = matcher.build_job_embeddings(jobs_df)

    resume_text = "Proficient in Python, Django, Docker, PostgreSQL, REST APIs, and Git."
    resume_skills = ["python", "django", "docker", "postgresql", "rest api", "git"]

    recs = recommender.recommend(
        resume_text=resume_text,
        resume_skills=resume_skills,
        jobs_df=jobs_df,
        job_embeddings=job_embeddings,
        top_n=5
    )

    # Acceptance criteria: exactly 5 jobs returned
    assert len(recs) == 5

    # Acceptance criteria: sorted descending by match_percent
    for i in range(len(recs) - 1):
        assert recs[i]["match_percent"] >= recs[i + 1]["match_percent"]

    # Verify each recommendation structure and formula
    for job in recs:
        assert "job_id" in job
        assert "title" in job
        assert "category" in job
        assert "match_percent" in job
        assert "semantic_score" in job
        assert "skill_overlap" in job
        assert "matched_skills" in job
        assert "missing_skills" in job

        # Acceptance criteria: matched_skills + missing_skills equals the job's required skills
        row = jobs_df[jobs_df["job_id"] == job["job_id"]].iloc[0]
        req_skills = [s.strip().lower() for s in row["required_skills"].split(";") if s.strip()]
        assert set(job["matched_skills"] + job["missing_skills"]) == set(req_skills)
        assert set(job["matched_skills"]).isdisjoint(set(job["missing_skills"]))


# ==========================================
# 5. FLASK API ENDPOINT TESTS (FR-6)
# ==========================================
def test_api_health():
    """GET /api/health returns status ok."""
    client = app.test_client()
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_api_jobs():
    """GET /api/jobs returns catalogue of 28 jobs."""
    client = app.test_client()
    res = client.get("/api/jobs")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert data["count"] == 28
    assert len(data["jobs"]) == 28


def test_api_index():
    """GET / serves the frontend html."""
    client = app.test_client()
    res = client.get("/")
    assert res.status_code == 200
    assert b"AI Resume &amp; Job Matcher" in res.data or b"AI Resume" in res.data


def test_api_analyze_missing_field():
    """POST /api/analyze without file returns 400."""
    client = app.test_client()
    res = client.post("/api/analyze")
    assert res.status_code == 400
    assert res.get_json()["status"] == "error"


def test_api_analyze_invalid_extension():
    """POST /api/analyze with non-PDF returns 400."""
    client = app.test_client()
    res = client.post(
        "/api/analyze",
        data={"resume": (io.BytesIO(b"Hello world"), "resume.txt")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    assert res.get_json()["status"] == "error"
    assert "Only PDF" in res.get_json()["message"]


def test_api_analyze_corrupt_pdf():
    """POST /api/analyze with corrupt PDF returns 400."""
    client = app.test_client()
    res = client.post(
        "/api/analyze",
        data={"resume": (io.BytesIO(b"Corrupt data"), "corrupt.pdf")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    assert res.get_json()["status"] == "error"
    assert "Could not extract text from PDF" in res.get_json()["message"]


def test_api_analyze_oversized_file():
    """POST /api/analyze with file > 5 MB returns 413."""
    client = app.test_client()
    oversized = io.BytesIO(b"0" * (5 * 1024 * 1024 + 1024))
    res = client.post(
        "/api/analyze",
        data={"resume": (oversized, "huge.pdf")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 413
    assert res.get_json()["status"] == "error"
    assert "exceeds" in res.get_json()["message"].lower()


def test_api_analyze_success():
    """POST /api/analyze with valid PDF returns 200 with full SRS response schema."""
    client = app.test_client()
    res = client.post(
        "/api/analyze",
        data={"resume": (io.BytesIO(SAMPLE_PDF_BYTES), "john_doe.pdf")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"

    # Candidate details
    candidate = data["candidate"]
    assert candidate["email"] == "john.doe@example.com"
    assert candidate["phone"] == "+91 9876543210"
    assert len(candidate["education"]) >= 1
    assert "python" in candidate["skills"]

    # Predicted role
    predicted_role = data["predicted_role"]
    assert "title" in predicted_role
    assert "confidence" in predicted_role
    assert 0.0 <= predicted_role["confidence"] <= 1.0

    # Recommended jobs
    jobs = data["recommended_jobs"]
    assert len(jobs) == 5
    first_job = jobs[0]
    assert first_job["match_percent"] > 0
    assert "matched_skills" in first_job
    assert "missing_skills" in first_job
