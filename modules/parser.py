"""Resume parser module for extracting raw text from PDF files."""

import pdfplumber


def extract_text(file_stream) -> str:
    """Extract all text content from an in-memory PDF file stream.

    Args:
        file_stream: A file-like object or bytes stream of a PDF file.

    Returns:
        str: Concatenated text of all PDF pages separated by newlines.

    Raises:
        ValueError: If no readable text can be extracted from the PDF.
    """
    extracted_pages = []

    try:
        # Open PDF stream using pdfplumber without writing to disk
        with pdfplumber.open(file_stream) as pdf:
            if not pdf.pages:
                raise ValueError("Could not extract text from PDF")
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)
    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError("Could not extract text from PDF") from exc

    # Combine extracted text across all pages
    combined_text = "\n".join(extracted_pages).strip()

    # Empty or whitespace-only PDF check
    if not combined_text:
        raise ValueError("Could not extract text from PDF")

    return combined_text

