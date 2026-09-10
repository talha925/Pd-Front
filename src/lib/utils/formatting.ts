/**
 * Converts a string to a URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Capitalizes the first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Processes tags string into an array
 */
export const processTags = (tagsString: string): string[] => {
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

import { decode } from 'html-entities';

/**
 * Decodes HTML entities recursively until the string is completely clean.
 * Handles single, double, or triple-encoded entities (e.g. &lt;p&gt; -> <p>).
 */
export function decodeRecursively(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  let currentText = text;
  let decodedText = decode(currentText);
  let iterations = 0;
  while (decodedText !== currentText && iterations < 5) {
    currentText = decodedText;
    decodedText = decode(currentText);
    iterations++;
  }
  return decodedText;
}

/**
 * Decodes HTML entities in a string
 */
export const decodeHTML = (input?: string | null): string => {
  if (!input) return '';
  return decodeRecursively(input);
};

/**
 * Cleans ugly backticks, HTML entities, and formatting artifacts from text strings
 * e.g. "you`re" -> "you're", "don&#x27;t" -> "don't", "```" removal
 */
export const cleanTypography = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Recursively decode common HTML entities in case of double/triple encoding
  for (let i = 0; i < 3; i++) {
    if (!/&(?:amp|#39|#x27|quot|lt|gt|#8216|#8217|#8220|#8221|lsquo|rsquo|ldquo|rdquo|apos);/i.test(str)) {
      break;
    }
    str = str
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"')
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  return str
    // Replace backtick used as apostrophe
    .replace(/(\w)`(\w)/g, "$1'$2")
    .replace(/`([a-zA-Z])/g, "'$1")
    // Replace unicode replacement character artifact with clean middot
    .replace(/\uFFFD/g, '·')
    // Remove stray markdown code fences
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '');
};

/**
 * Dynamic Brand Text Sanitizer:
 * Cleans typography and replaces any foreign brand mentions with the current brand name
 */
export const sanitizeBrandText = (text: string | null | undefined, currentBrandName: string = 'Penny Scroll'): string => {
  if (!text || typeof text !== 'string') return '';
  const cleaned = cleanTypography(text);
  const domainBrand = currentBrandName.toLowerCase().replace(/[^a-z0-9]/g, '');

  let result = cleaned;

  // 1. First, replace URLs/domains so they are strictly clean without spaces or %20
  result = result
    .replace(/(https?:\/\/(?:www\.)?)(?:blogzenix|pennyscroll|penny(?:\s+|%20)*scroll|reviewchronicle|specreveal|trustlense|trendfiltered)\.com/gi, `$1${domainBrand}.com`)
    .replace(/(href=["']https?:\/\/(?:www\.)?)(?:blogzenix|pennyscroll|penny(?:\s+|%20)*scroll|reviewchronicle|specreveal|trustlense|trendfiltered)\.com/gi, `$1${domainBrand}.com`);

  // 2. Fix any remaining penny%20scroll or penny scroll in URLs
  result = result
    .replace(/penny(?:\s+|%20)+scroll\.com/gi, `${domainBrand}.com`)
    .replace(/blogzenix\.com/gi, `${domainBrand}.com`);

  // 3. For textual brand mentions (outside domain names), replace foreign brands with currentBrandName
  result = result
    .replace(/\bBlogZenix\b/gi, currentBrandName)
    .replace(/\bReview\s*Chronicle\b/gi, currentBrandName)
    .replace(/\bSpec\s*Reveal\b/gi, currentBrandName)
    .replace(/\bTrust\s*Lense\b/gi, currentBrandName)
    .replace(/\bTrend\s*Filtered\b/gi, currentBrandName);

  return result;
}; 