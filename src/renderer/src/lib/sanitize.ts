import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML string safe to render
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  })
}

/**
 * Sanitize markdown-converted HTML with additional safety
 * @param html - The HTML content (from markdown) to sanitize
 * @returns Sanitized HTML string safe to render
 */
export function sanitizeMarkdown(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'h1', 'h2', 'h3',
      'ul', 'ol', 'li', 'a', 'code'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class'],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  })
}