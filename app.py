"""Flask application entry point for the AI-Based Resume & Job Matching System."""

import io
import logging
from pathlib import Path
from flask import Flask, jsonify, render_template, request
import pandas as pd
from werkzeug.exceptions import RequestEntityTooLarge

import config
from modules import classifier, extractor, matcher, parser, recommender

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__, template_folder=str(config.TEMPLATES_DIR))
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

# Global in-memory cache for jobs and precomputed embeddings
jobs_df: pd.DataFrame = None
job_embeddings = None


def load_application_state():
    """Load jobs catalog, precompute embeddings, and load trained classifier once at startup."""
    global jobs_df, job_embeddings

    logger.info("Initializing system state and data catalogues...")

    # Load jobs catalog
    jobs_path = Path(config.JOBS_CSV)
    if not jobs_path.exists():
        logger.error("Jobs CSV not found at %s. Please ensure data/jobs.csv exists.", jobs_path)
        jobs_df = pd.DataFrame(columns=["job_id", "title", "category", "required_skills", "description"])
    else:
        jobs_df = pd.read_csv(jobs_path)
        logger.info("Loaded %d jobs from %s", len(jobs_df), jobs_path)

    # Precompute job embeddings once at startup
    if not jobs_df.empty:
        job_embeddings = matcher.build_job_embeddings(jobs_df)
        logger.info("Precomputed job embeddings matrix with shape: %s", getattr(job_embeddings, "shape", None))

    # Load classifier model once at startup
    model_path = Path(config.ROLE_CLASSIFIER_PATH)
    if model_path.exists():
        classifier.load_model(str(model_path))
        logger.info("Loaded role classifier model from %s", model_path)
    else:
        logger.warning("Classifier model not found at %s. Please run python train.py first.", model_path)


# Error Handlers
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(error):
    """Handle files exceeding the 5 MB limit."""
    return jsonify({"status": "error", "message": "File exceeds the maximum allowed size of 5 MB"}), 413


@app.errorhandler(400)
def handle_bad_request(error):
    """Handle generic bad requests."""
    message = getattr(error, "description", "Bad Request")
    return jsonify({"status": "error", "message": message}), 400


@app.errorhandler(500)
def handle_internal_server_error(error):
    """Handle internal server errors gracefully without exposing internals."""
    logger.exception("Internal server error: %s", error)
    return jsonify({"status": "error", "message": "An unexpected server error occurred"}), 500


# Application Routes
@app.route("/")
def index():
    """Serve the single-page frontend application."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200


@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    """Return catalogue of all available jobs."""
    if jobs_df is None or jobs_df.empty:
        return jsonify({"status": "success", "count": 0, "jobs": []}), 200

    jobs_list = []
    for _, row in jobs_df.iterrows():
        skills = [s.strip().lower() for s in str(row.get("required_skills", "")).split(";") if s.strip()]
        jobs_list.append(
            {
                "job_id": int(row.get("job_id", 0)),
                "title": str(row.get("title", "")),
                "category": str(row.get("category", "")),
                "required_skills": skills,
                "description": str(row.get("description", "")),
            }
        )

    return jsonify({"status": "success", "count": len(jobs_list), "jobs": jobs_list}), 200


@app.route("/api/analyze", methods=["POST"])
def analyze_resume():
    """Analyze an uploaded PDF resume, extract details, predict role, and recommend jobs."""
    # 1. Validate file field
    if "resume" not in request.files:
        return jsonify({"status": "error", "message": "Missing 'resume' file in upload"}), 400

    file = request.files["resume"]
    filename = (file.filename or "").strip()

    if not filename:
        return jsonify({"status": "error", "message": "No file selected"}), 400

    if not filename.lower().endswith(".pdf"):
        return jsonify({"status": "error", "message": "Only PDF files are supported"}), 400

    try:
        # Read file into in-memory stream (do not write to disk)
        file_bytes = file.read()
        if not file_bytes:
            return jsonify({"status": "error", "message": "Uploaded PDF file is empty"}), 400

        if len(file_bytes) > config.MAX_CONTENT_LENGTH:
            return jsonify({"status": "error", "message": "File exceeds the maximum allowed size of 5 MB"}), 413

        stream = io.BytesIO(file_bytes)

        # 2. Extract text using PDF parser
        try:
            resume_text = parser.extract_text(stream)
        except ValueError as ve:
            return jsonify({"status": "error", "message": str(ve)}), 400

        # 3. Extract candidate information (email, phone, education, skills)
        candidate_info = extractor.extract_info(resume_text)

        # 4. Predict role category and confidence
        try:
            role_title, confidence = classifier.predict_role(resume_text)
        except Exception as e:
            logger.warning("Classifier prediction issue: %s", e)
            role_title, confidence = "General", 0.50

        # 5. Recommend jobs and skill gaps
        recommended = recommender.recommend(
            resume_text=resume_text,
            resume_skills=candidate_info.get("skills", []),
            jobs_df=jobs_df,
            job_embeddings=job_embeddings,
            top_n=config.TOP_N_RECOMMENDATIONS,
        )

        response_payload = {
            "status": "success",
            "candidate": candidate_info,
            "predicted_role": {
                "title": role_title,
                "confidence": confidence,
            },
            "recommended_jobs": recommended,
        }

        return jsonify(response_payload), 200

    except Exception as exc:
        logger.exception("Error processing resume upload: %s", exc)
        return jsonify({"status": "error", "message": "Failed to analyze resume"}), 500


# Load model and embeddings once at application load
load_application_state()

if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
