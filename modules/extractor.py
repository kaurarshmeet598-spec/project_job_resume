"""Information extraction module for resumes (email, phone, education, skills)."""

import re
from pathlib import Path
import spacy
from spacy.matcher import PhraseMatcher
import config

# Initialize lightweight English blank model (no model download needed)
_nlp = spacy.blank("en")
_matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")


def _load_skills_matcher():
    """Load skill phrases from skills.txt into the spaCy PhraseMatcher once at import time."""
    skills_file = Path(config.SKILLS_TXT)
    if not skills_file.exists():
        return

    with open(skills_file, "r", encoding="utf-8") as f:
        skill_phrases = [line.strip().lower() for line in f if line.strip()]

    # Convert phrase strings into spaCy Doc objects for PhraseMatcher
    patterns = [_nlp.make_doc(phrase) for phrase in skill_phrases]
    _matcher.add("SKILLS", patterns)


# Build skills matcher once at import time
_load_skills_matcher()

# Regular expressions for contact information
_EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_REGEX = re.compile(
    r"(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(?:\+?\d{1,3}[-.\s]?)?\b\d{10}\b|(?:\+\d{1,3}[-.\s]?\d{5}[-.\s]?\d{5}))"
)

# Education degree keywords specified in SRS FR-2
_DEGREE_KEYWORDS = [
    r"\bb\.?tech\b",
    r"\bbca\b",
    r"\bmca\b",
    r"\bb\.?sc\b",
    r"\bm\.?sc\b",
    r"\bmba\b",
    r"\bbachelor\b",
    r"\bmaster\b",
    r"\bphd\b",
    r"\bdiploma\b",
    r"\bb\.?e\.?\b",
    r"\bm\.?tech\b",
]
_DEGREE_PATTERN = re.compile("|".join(_DEGREE_KEYWORDS), re.IGNORECASE)


def extract_info(text: str) -> dict:
    """Extract email, phone, education, and skills from raw resume text.

    Args:
        text: Raw text content of the resume.

    Returns:
        dict: A dictionary containing:
            - email: str or None
            - phone: str or None
            - education: list[str] (max 5 matching lines)
            - skills: list[str] (unique, lowercase, sorted)
    """
    # Extract email
    email_match = _EMAIL_REGEX.search(text)
    email = email_match.group(0) if email_match else None

    # Extract phone
    phone_match = _PHONE_REGEX.search(text)
    phone = phone_match.group(0).strip() if phone_match else None

    # Extract education lines (matching degree keywords, maximum 5 lines)
    education_lines = []
    for line in text.splitlines():
        cleaned_line = line.strip()
        if cleaned_line and _DEGREE_PATTERN.search(cleaned_line):
            # Ignore false matches like 'Scrum Master' unless an actual degree keyword is also present
            if re.search(r"\bscrum master\b", cleaned_line, re.IGNORECASE) and not re.search(
                r"\b(bachelor|degree|university|college|institute|graduat|b\.?tech|m\.?tech|bca|mca|b\.?sc|m\.?sc|mba|phd|diploma)\b",
                cleaned_line,
                re.IGNORECASE,
            ):
                continue
            if cleaned_line not in education_lines:
                education_lines.append(cleaned_line)
            if len(education_lines) >= 5:
                break

    # Extract skills using spaCy PhraseMatcher
    doc = _nlp(text)
    matches = _matcher(doc)
    extracted_skills = set()

    for match_id, start, end in matches:
        span = doc[start:end]
        extracted_skills.add(span.text.lower())

    # Return unique, lowercase, alphabetically sorted skills
    skills = sorted(list(extracted_skills))

    return {
        "email": email,
        "phone": phone,
        "education": education_lines,
        "skills": skills,
    }
