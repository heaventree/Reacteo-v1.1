export interface SEOAnalysisResult {
  wordCount: number;
  readingTime: number; // in minutes
  fleschKincaid: number; // 0-100 score
  keywordDensity: number; // percentage
  internalLinks: number;
  externalLinks: number;
  score: number; // 0-100 overall score
}

export function analyzeContent(
  content: string,
  keyword: string,
  baseUrl: string
): SEOAnalysisResult {
  // 1. Remove HTML tags to extract raw text
  const textOnly = content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const words = textOnly.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount = words.length;

  // 2. Reading time (assuming 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);

  // 3. Flesch-Kincaid (simplified ease of reading approximation)
  const sentences = textOnly.split(/[.!?]+/).filter(Boolean).length || 1;
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  // Flesch Reading Ease Formula
  const fleschKincaidRaw = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / (wordCount || 1));
  const fleschKincaid = Math.max(0, Math.min(100, Math.round(fleschKincaidRaw)));

  // 4. Keyword Density
  let keywordDensity = 0;
  if (keyword && wordCount > 0) {
    const kwWords = keyword.trim().toLowerCase().split(/\s+/).length;
    // Count exact matches of the keyword phrase
    const regex = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'g');
    const matches = (textOnly.toLowerCase().match(regex) || []).length;
    keywordDensity = Number(((matches * kwWords / wordCount) * 100).toFixed(2));
  }

  // 5. Links Analysis
  const links = content.match(/<a[^>]+href="([^">]+)"/g) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  
  links.forEach(link => {
    const match = link.match(/href="([^">]+)"/);
    if (match && match[1]) {
      const url = match[1];
      if (url.startsWith('http') && !url.includes(baseUrl)) {
        externalLinks++;
      } else if (url.startsWith('/') || url.includes(baseUrl)) {
        internalLinks++;
      }
    }
  });

  // 6. Compute Base Score (0-100)
  let score = 30; // Base score just for having content
  if (wordCount > 300) score += 15;
  if (wordCount > 600) score += 15;
  if (wordCount > 1000) score += 10;
  
  if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
    score += 20; // Optimal density
  } else if (keywordDensity > 2.5) {
    score -= 10; // Keyword stuffing penalty
  }

  if (internalLinks > 0) score += 5;
  if (externalLinks > 0) score += 5;

  return {
    wordCount,
    readingTime,
    fleschKincaid,
    keywordDensity,
    internalLinks,
    externalLinks,
    score: Math.max(0, Math.min(100, score))
  };
}

// Utility: Rough syllable counter
function countSyllables(word: string): number {
  let w = word.toLowerCase();
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const syllables = w.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

// Utility: Escape regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}