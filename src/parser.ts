import zlib from 'zlib';
import pdfParse from 'pdf-parse';

/**
 * Fallback extractor for minimal or handwritten PDF streams (e.g., in unit tests).
 */
function extractFromStreams(buffer: Buffer): string {
  const binary = buffer.toString('binary');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  const lines: string[] = [];

  while ((match = streamRegex.exec(binary)) !== null) {
    let streamBuf = Buffer.from(match[1], 'binary');
    try {
      streamBuf = zlib.inflateSync(streamBuf);
    } catch {
      // Stream is uncompressed or raw
    }
    const streamStr = streamBuf.toString('latin1');

    // Extract (text) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(streamStr)) !== null) {
      lines.push(tjMatch[1]);
    }

    // Extract [(text)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjaMatch: RegExpExecArray | null;
    while ((tjaMatch = tjArrayRegex.exec(streamStr)) !== null) {
      const parts = tjaMatch[1].match(/\(([^)]+)\)/g);
      if (parts) {
        lines.push(parts.map((p) => p.slice(1, -1)).join(' '));
      }
    }
  }

  return lines.join('\n').trim();
}

/**
 * Extract raw text from an in-memory PDF buffer.
 *
 * @param buffer - Buffer containing the PDF binary data.
 * @returns Concatenated text of all pages.
 * @throws Error with message "Could not extract text from PDF" if parsing fails or result is empty.
 */
export async function extractText(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Could not extract text from PDF');
  }

  // Must have standard PDF magic header
  if (!buffer.toString('ascii', 0, Math.min(10, buffer.length)).includes('%PDF')) {
    throw new Error('Could not extract text from PDF');
  }

  let text = '';

  try {
    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim()) {
      text = data.text.trim();
    }
  } catch {
    // If pdf-parse failed (e.g., bad xref in handwritten test PDFs), attempt stream extraction
  }

  if (!text) {
    text = extractFromStreams(buffer);
  }

  if (!text || !text.trim()) {
    throw new Error('Could not extract text from PDF');
  }

  return text;
}
