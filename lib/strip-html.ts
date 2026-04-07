/** Plain text for search, previews, and line-clamp cards (strips tags from stored HTML). */
export function stripHtmlForPreview(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
