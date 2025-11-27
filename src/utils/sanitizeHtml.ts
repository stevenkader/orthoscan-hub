import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Removes potentially dangerous tags and attributes while preserving safe formatting
 */
export const sanitizeHtml = (html: string): string => {
  // Configure DOMPurify to allow only safe tags and attributes
  const config = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 'b', 'i',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'a',
      'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'class', 'id',
      'href', 'title', 'target',
      'colspan', 'rowspan',
      'style' // Limited style attribute for basic formatting
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  };

  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitizes HTML with stricter rules (no links, no styles)
 * Use for untrusted content that should have minimal formatting
 */
export const sanitizeHtmlStrict = (html: string): string => {
  const config = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'b', 'i',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true
  };

  return DOMPurify.sanitize(html, config);
};
