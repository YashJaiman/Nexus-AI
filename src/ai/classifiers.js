/**
 * Nexus AI - Intent and language classifiers
 */

/**
 * Normalizes user prompts for uniform matching.
 */
export function sanitizePrompt(prompt) {
  if (!prompt) return '';

  return prompt
    .toLowerCase()
    .replace(/\r?\n/g, ' ')
    .replace(/[?!,;:()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const LANGUAGE_PATTERNS = [
  { name: 'JavaScript', aliases: ['javascript', 'nodejs', 'node', 'js'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'Python', aliases: ['python', 'py'] },
  { name: 'C++', aliases: ['c++', 'cpp'] },
  { name: 'C', aliases: ['c language'] },
  { name: 'React/JSX', aliases: ['react', 'jsx'] },
  { name: 'Rust', aliases: ['rust'] },
  { name: 'Go', aliases: ['golang', 'go'] },
  { name: 'Java', aliases: ['java'] },
  { name: 'SQL', aliases: ['sql', 'postgres', 'postgresql', 'mysql'] },
  { name: 'HTML/CSS', aliases: ['html', 'css'] }
];

const GREETING_PHRASES = [
  'hello',
  'hi',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'howdy'
];

const CONVERSATION_PHRASES = [
  'what is your name',
  'whats your name',
  'who are you',
  'tell me about yourself',
  'what can you do',
  'can you help me',
  'how are you',
  'thank you',
  'thanks',
  'nice to meet you',
  'who made you',
  'who created you'
];

const IDENTITY_PHRASES = [
  'what is your name',
  'whats your name',
  'who are you',
  'tell me about yourself',
  'who made you',
  'who created you'
];

const TRANSLATION_KEYWORDS = [
  'translate',
  'translation',
  'meaning in hindi',
  'in hindi',
  'in english'
];

const DEFINITION_KEYWORDS = [
  'definition of',
  'meaning of',
  'define',
  'what is'
];

const DEBUG_KEYWORDS = [
  'error',
  'bug',
  'debug',
  'fix',
  'crash',
  'broken',
  'failing',
  'failed',
  'not working',
  'stack trace',
  'stacktrace',
  'exception',
  'undefined',
  'null',
  'cannot read',
  'cors',
  'issue'
];

const PRODUCTIVITY_KEYWORDS = [
  'task',
  'todo',
  'checklist',
  'schedule',
  'calendar',
  'plan',
  'prioritize',
  'focus',
  'workflow',
  'productivity',
  'roadmap'
];

const ANALYTICS_KEYWORDS = [
  'analytics',
  'report',
  'metric',
  'metrics',
  'performance',
  'workspace stats',
  'dashboard insights'
];

const WORKSPACE_KEYWORDS = [
  'workspace',
  'dashboard',
  'project status',
  'task status',
  'activity feed'
];

const NOTES_KEYWORDS = [
  'note',
  'notes',
  'memo',
  'document',
  'draft',
  'summary',
  'meeting notes',
  'write a spec',
  'specification'
];

const FACTUAL_KEYWORDS = [
  'what is',
  'who is',
  'define',
  'meaning of',
  'explain',
  'how does',
  'why does',
  'tell me about',
  'capital of',
  'difference between'
];

const CODING_ACTIONS = [
  'write',
  'create',
  'build',
  'generate',
  'implement',
  'show',
  'give',
  'refactor',
  'optimize',
  'convert',
  'rewrite',
  'debug'
];

const CODING_OBJECTS = [
  'code',
  'function',
  'component',
  'class',
  'script',
  'api',
  'endpoint',
  'query',
  'regex',
  'algorithm',
  'middleware',
  'hook',
  'schema',
  'server',
  'route',
  'controller',
  'model',
  'express',
  'react',
  'mongoose',
  'jwt',
  'html',
  'css',
  'sql'
];

function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  return text.includes(phrase);
}

function containsWord(text, word) {
  if (!text || !word) return false;
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text);
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => {
    return pattern.includes(' ') || /[+/#]/.test(pattern)
      ? containsPhrase(text, pattern)
      : containsWord(text, pattern);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksLikeGreeting(text) {
  if (!text) return false;
  return GREETING_PHRASES.some((phrase) => text === phrase || text === `${phrase} nexus ai`);
}

function findLanguageInText(text) {
  if (!text) return null;

  for (const language of LANGUAGE_PATTERNS) {
    for (const alias of language.aliases) {
      if (alias === 'go' || alias === 'js' || alias === 'ts') {
        if (containsWord(text, alias)) {
          return language.name;
        }
        continue;
      }

      if (alias === 'c language') {
        if (
          containsPhrase(text, 'c language') ||
          /\bin c\b/.test(text) ||
          /\bc code\b/.test(text) ||
          /\busing c\b/.test(text)
        ) {
          return language.name;
        }
        continue;
      }

      if (containsPhrase(text, alias) || containsWord(text, alias)) {
        return language.name;
      }
    }
  }

  return null;
}

function isCodingRequest(sanitizedPrompt) {
  const hasExplicitCodeWord =
    containsAny(sanitizedPrompt, CODING_OBJECTS) ||
    containsPhrase(sanitizedPrompt, 'code snippet') ||
    containsPhrase(sanitizedPrompt, 'hello world');
  const hasCodingAction = containsAny(sanitizedPrompt, CODING_ACTIONS);
  const hasLanguageMention = Boolean(findLanguageInText(sanitizedPrompt));
  const hasCodeFormattingCue =
    containsPhrase(sanitizedPrompt, '```') ||
    containsPhrase(sanitizedPrompt, 'console.log') ||
    containsPhrase(sanitizedPrompt, 'import ') ||
    containsPhrase(sanitizedPrompt, 'export ');

  if (hasCodeFormattingCue) return true;
  if (containsPhrase(sanitizedPrompt, 'how to code')) return true;
  if (hasCodingAction && hasExplicitCodeWord) return true;
  if (hasLanguageMention && (hasCodingAction || hasExplicitCodeWord)) return true;
  if (containsPhrase(sanitizedPrompt, 'example in ') || containsPhrase(sanitizedPrompt, 'in javascript')) return true;

  return false;
}

/**
 * Evaluates the active programming language from prompt or chat context.
 */
export function detectLanguage(sanitizedPrompt, historyContext = []) {
  const directMatch = findLanguageInText(sanitizedPrompt);
  if (directMatch) {
    return directMatch;
  }

  for (let i = historyContext.length - 1; i >= 0; i--) {
    const msg = historyContext[i];
    const text = sanitizePrompt(msg?.text || '');

    if (msg?.role === 'user') {
      const historyMatch = findLanguageInText(text);
      if (historyMatch) {
        return historyMatch;
      }
    }

    if (msg?.role === 'ai' || msg?.role === 'model') {
      const codeFenceMatch = msg?.text?.match(/```(\w+|\+\+)/);
      if (codeFenceMatch) {
        const fenceText = codeFenceMatch[1].toLowerCase();
        const fenceMatch = findLanguageInText(fenceText);
        if (fenceMatch) {
          return fenceMatch;
        }
      }
    }
  }

  return null;
}

/**
 * Computes intent from guarded keyword checks instead of broad keyword scoring.
 */
export function classifyIntent(sanitizedPrompt) {
  if (!sanitizedPrompt) {
    return { intent: 'general', confidence: 0 };
  }

  if (looksLikeGreeting(sanitizedPrompt)) {
    return { intent: 'greeting', confidence: 4 };
  }

  if (containsAny(sanitizedPrompt, IDENTITY_PHRASES)) {
    return { intent: 'identity', confidence: 4 };
  }

  if (containsAny(sanitizedPrompt, TRANSLATION_KEYWORDS) || /meaning of .+ in hindi/.test(sanitizedPrompt)) {
    return { intent: 'translation', confidence: 3.8 };
  }

  if (containsAny(sanitizedPrompt, DEFINITION_KEYWORDS)) {
    return { intent: 'definition', confidence: 3.6 };
  }

  if (containsAny(sanitizedPrompt, CONVERSATION_PHRASES)) {
    return { intent: 'conversation', confidence: 4 };
  }

  if (containsAny(sanitizedPrompt, DEBUG_KEYWORDS)) {
    return { intent: 'debugging', confidence: 3.5 };
  }

  if (containsAny(sanitizedPrompt, PRODUCTIVITY_KEYWORDS)) {
    return { intent: 'productivity', confidence: 3 };
  }

  if (containsAny(sanitizedPrompt, ANALYTICS_KEYWORDS)) {
    return { intent: 'analytics', confidence: 3 };
  }

  if (containsAny(sanitizedPrompt, WORKSPACE_KEYWORDS)) {
    return { intent: 'workspace', confidence: 3 };
  }

  if (containsAny(sanitizedPrompt, NOTES_KEYWORDS)) {
    return { intent: 'notes', confidence: 3 };
  }

  if (isCodingRequest(sanitizedPrompt)) {
    return { intent: 'coding', confidence: 3.25 };
  }

  if (containsAny(sanitizedPrompt, FACTUAL_KEYWORDS)) {
    return { intent: 'factual', confidence: 2.5 };
  }

  return { intent: 'general', confidence: 1 };
}
