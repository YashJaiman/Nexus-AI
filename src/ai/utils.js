/**
 * Nexus AI — AI Helper Utilities
 */

/**
 * Limits history check window to prevent memory leaks and keep lookups fast.
 */
export function limitHistory(history = [], maxMsgCount = 6) {
  if (!history || history.length === 0) return [];
  // Return the last N messages
  return history.slice(-maxMsgCount);
}

/**
 * Computes a quick character-based token estimation.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Escapes and balances markdown code fences to prevent client side rendering crashes.
 */
export function sanitizeMarkdown(markdown) {
  if (!markdown) return '';
  
  // Count standard triple backticks occurrences
  const backticksCount = (markdown.match(/```/g) || []).length;
  
  // If we have an odd count of fences, append one at the end to balance it
  if (backticksCount % 2 !== 0) {
    return markdown + '\n```';
  }
  
  return markdown;
}

/**
 * Simple asynchronous timeout promise wrapper.
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
