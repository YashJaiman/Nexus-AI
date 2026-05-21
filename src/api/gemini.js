/**
 * Nexus AI — Gemini API Client Helper
 * 
 * Scalable client module supporting actual Gemini API integration
 * with modular local intelligence fallback.
 */
import { routeLocalIntelligence } from '../ai/generators.js';

// Retrieve the secure frontend env key
const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
let lastFallbackNoticeAt = 0;

// System instruction to align Gemini responses with the Nexus AI premium dark futuristic SaaS visual guidelines
const SYSTEM_INSTRUCTION = `You are Nexus AI, a premium, state-of-the-art AI Productivity Assistant integrated directly into the Nexus AI Dashboard.
Visual & Tone Guidelines:
1. Always maintain a professional, futuristic, and highly intelligent persona.
2. Structure your answers in clean, readable Markdown (headings, bold text, bullet points, and tables are preferred).
3. Use developer-friendly concepts and visual emojis (e.g., ⬡, 🤖, ✦, ⚡) that match our cyan/purple cyberpunk SaaS branding.
4. Keep paragraphs short and concise. Present data clearly and beautifully.
5. Offer practical productivity improvements, task workflows, and code snippets when requested.`;

/**
 * Formats message history from our standard storage format:
 *   [{ role: 'user' | 'ai', text: string }]
 * to the API structure expected by Gemini:
 *   [{ role: 'user' | 'model', parts: [{ text: string }] }]
 */
function formatHistoryForGemini(messages) {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
}

/**
 * Sends a message to the Gemini API with conversation history context
 * @param {string} prompt - The current user message
 * @param {Array} history - Array of previous messages in the current conversation
 * @returns {Promise<string>} The AI response
 */
export async function sendMessageToGemini(prompt, history = []) {
  // If no API key is set, fall back to modular local sync mode
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    console.info('[Nexus AI] No VITE_GEMINI_API_KEY set — using local neural sync.');
    return routeLocalIntelligence(prompt, history);
  }

  try {
    // Format existing conversation history to Gemini structure
    const formattedHistory = formatHistoryForGemini(history);

    // Gemini API requires alternating user/model roles.
    const cleanHistory = [];
    for (const msg of formattedHistory) {
      if (cleanHistory.length === 0 || cleanHistory[cleanHistory.length - 1].role !== msg.role) {
        cleanHistory.push(msg);
      }
    }

    // Add current user prompt at the end of the history
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
      cleanHistory.pop();
    }
    cleanHistory.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: cleanHistory,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });

        if (response.ok) {
          break;
        }

        // Wait and retry once on temporary errors or rate limits
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempts < maxAttempts) {
            console.warn(`[Nexus AI] API status ${response.status}. Retrying in 1.5s...`);
            await new Promise(r => setTimeout(r, 1500));
            continue;
          }
        }
        break;
      } catch (err) {
        if (attempts < maxAttempts) {
          console.warn(`[Nexus AI] Connection error: ${err.message}. Retrying...`);
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        throw err;
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('[Nexus AI] Gemini API error final status:', response.status, errData);
      // Silent switch to local mode with polished notice
      const localResponse = await routeLocalIntelligence(prompt, history);
      return `⚠️ *Nexus AI cloud capacity is temporarily busy. Switching to local neural mode.*\n\n${localResponse}`;
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      console.warn('[Nexus AI] Empty response from Gemini API');
      throw new Error('Empty response received from Gemini API');
    }

    return replyText;
  } catch (error) {
    console.error('[Nexus AI] Gemini API exception:', error.message);
    // Silent switch to local mode with polished notice
    const localResponse = await routeLocalIntelligence(prompt, history);
    return `⚠️ *Nexus AI cloud capacity is temporarily busy. Switching to local neural mode.*\n\n${localResponse}`;
  }
}
