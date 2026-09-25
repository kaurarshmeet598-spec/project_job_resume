"""Semantic matching module using sentence-transformers with TF-IDF fallback."""

import logging
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import config

logger = logging.getLogger(__name__)

# Global model and fallback state
_model = None
_tfidf_vectorizer = None
_using_fallback = False


def _init_model():
    """Initialize the sentence transformer model or enable fallback on failure."""
    global _model, _using_fallback
    if not config.USE_EMBEDDINGS:
        logger.info("USE_EMBEDDINGS is False; utilizing TF-IDF fallback.")
        _using_fallback = True
        return

    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model: %s", config.EMBEDDING_MODEL_NAME)
        _model = SentenceTransformer(config.EMBEDDING_MODEL_NAME)
        _using_fallback = False
    except Exception as e:
        logger.warning(
            "Could not load SentenceTransformer (%s). Falling back to TF-IDF matching: %s",
            config.EMBEDDING_MODEL_NAME,
            e,
        )
        _using_fallback = True


# Initialize model at import time
_init_model()


def build_job_embeddings(jobs_df: pd.DataFrame) -> np.ndarray:
    """Build embedding representations for all jobs in the catalogue.

    Embeds 'title + description + required_skills' for every job once at startup.

    Args:
        jobs_df: DataFrame containing job catalog with title, description, and required_skills.

    Returns:
        np.ndarray: Matrix of job embeddings or TF-IDF vectors.
    """
    global _tfidf_vectorizer, _using_fallback

    # Prepare composite text for each job
    job_texts = []
    for _, row in jobs_df.iterrows():
        title = str(row.get("title", ""))
        desc = str(row.get("description", ""))
        skills = str(row.get("required_skills", "")).replace(";", " ")
        combined = f"{title}. {desc} Skills: {skills}"
        job_texts.append(combined)

    if not _using_fallback and _model is not None:
        embeddings = _model.encode(job_texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings
    else:
        # TF-IDF Fallback
        _using_fallback = True
        _tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
        tfidf_matrix = _tfidf_vectorizer.fit_transform(job_texts).toarray()
        return tfidf_matrix


def semantic_scores(resume_text: str, job_embeddings: np.ndarray) -> list[float]:
    """Compute cosine similarity of the resume against each job embedding.

    Args:
        resume_text: Raw or cleaned resume text.
        job_embeddings: Precomputed 2D numpy array of job embeddings.

    Returns:
        list[float]: Cosine similarity scores clipped to [0, 1].
    """
    if not resume_text or job_embeddings is None or len(job_embeddings) == 0:
        return [0.0] * (len(job_embeddings) if job_embeddings is not None else 0)

    if not _using_fallback and _model is not None:
        resume_emb = _model.encode([resume_text], convert_to_numpy=True, normalize_embeddings=True)
        # Cosine similarity for normalized vectors is the dot product
        similarities = np.dot(job_embeddings, resume_emb.T).flatten()
    else:
        # TF-IDF Fallback
        if _tfidf_vectorizer is None:
            return [0.0] * len(job_embeddings)
        resume_tfidf = _tfidf_vectorizer.transform([resume_text]).toarray()
        similarities = cosine_similarity(resume_tfidf, job_embeddings).flatten()

    # Clip scores to range [0.0, 1.0] and convert to list of floats
    clipped = np.clip(similarities, 0.0, 1.0)
    return [round(float(s), 4) for s in clipped]
