"""Role classifier module for training and predicting job categories from resume text."""

import os
import re
from pathlib import Path
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

import config

# Global loaded model instance cached for prediction
_model = None


def clean_text(text: str) -> str:
    """Lowercase and remove URLs, punctuation, and extra whitespace.

    Args:
        text: Raw text string.

    Returns:
        str: Cleaned normalized text.
    """
    if not text or not isinstance(text, str):
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Remove email addresses and special punctuation/symbols
    text = re.sub(r"[^\w\s]", " ", text)

    # Collapse multiple whitespaces into a single space
    text = re.sub(r"\s+", " ", text).strip()

    return text


def train(csv_path: str, model_path: str) -> dict:
    """Train a TF-IDF + LogisticRegression pipeline on labeled resume data.

    Args:
        csv_path: Path to CSV containing 'Resume' and 'Category' columns.
        model_path: Destination path where the trained joblib model will be saved.

    Returns:
        dict: Training metrics {"accuracy": float, "num_classes": int}.
    """
    df = pd.read_csv(csv_path)

    # Validate required columns
    if "Resume" not in df.columns or "Category" not in df.columns:
        raise ValueError("CSV must contain 'Resume' and 'Category' columns")

    # Clean text data
    df["clean_resume"] = df["Resume"].fillna("").apply(clean_text)

    # Filter out empty entries
    df = df[df["clean_resume"].str.strip() != ""]

    X = df["clean_resume"]
    y = df["Category"]

    num_classes = y.nunique()

    # 80/20 stratified split with reproducible seed
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Build scikit-learn pipeline specified in SRS FR-3
    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(max_features=5000, stop_words="english"),
            ),
            (
                "clf",
                LogisticRegression(max_iter=1000, random_state=42),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)

    # Evaluate accuracy on test split
    y_pred = pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))

    # Ensure models directory exists and save pipeline
    save_path = Path(model_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, save_path)

    global _model
    _model = pipeline

    return {"accuracy": round(accuracy, 4), "num_classes": num_classes}


def load_model(model_path: str = None):
    """Load the trained role classifier model into memory.

    Args:
        model_path: Path to the saved model file. Defaults to config.ROLE_CLASSIFIER_PATH.

    Returns:
        The loaded pipeline model.
    """
    global _model
    target_path = Path(model_path or config.ROLE_CLASSIFIER_PATH)

    if not target_path.exists():
        raise FileNotFoundError(
            f"Classifier model not found at {target_path}. Please run train.py first."
        )

    _model = joblib.load(target_path)
    return _model


def predict_role(text: str) -> tuple[str, float]:
    """Predict the role category and confidence score for a given resume text.

    Args:
        text: Raw or preprocessed resume text.

    Returns:
        tuple[str, float]: (predicted_category, confidence_probability) rounded to 2 decimals.
    """
    global _model
    if _model is None:
        load_model()

    cleaned = clean_text(text)
    if not cleaned:
        return ("Unknown", 0.0)

    # Get class probabilities
    probabilities = _model.predict_proba([cleaned])[0]
    classes = _model.classes_

    # Find highest probability class
    max_idx = probabilities.argmax()
    predicted_class = str(classes[max_idx])
    confidence = float(probabilities[max_idx])

    return (predicted_class, round(confidence, 2))
