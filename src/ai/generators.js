/**
 * Nexus AI - Specialized response generators and local routing
 */
import { sanitizePrompt, detectLanguage, classifyIntent } from './classifiers.js';
import { lookupKnowledge } from './knowledgeBase.js';
import { lookupTemplate } from './templates.js';
import { sanitizeMarkdown, limitHistory } from './utils.js';

const responseCache = new Map();
let lastFallbackStructureIdx = 0;

const TONE_VARIATIONS = {
  futuristic: {
    intro: 'Got it.',
    outro: 'If you want, I can map the next step.',
    bulletPrefix: '- '
  },
  friendly: {
    intro: 'Sure.',
    outro: 'I can tailor this to your exact case.',
    bulletPrefix: '- '
  },
  professional: {
    intro: 'Understood.',
    outro: 'I can turn this into an implementation plan.',
    bulletPrefix: '- '
  }
};

function buildCacheKey(prompt, history = []) {
  const recentHistory = limitHistory(history, 4)
    .map((msg) => `${msg.role}:${sanitizePrompt(msg.text || '').slice(0, 80)}`)
    .join('|');

  return `${sanitizePrompt(prompt)}::${recentHistory}`;
}

function getLastUserMessage(history = []) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === 'user') {
      return history[i];
    }
  }
  return null;
}

function getRecentUserTopics(history = []) {
  return limitHistory(history, 3)
    .filter((msg) => msg?.role === 'user')
    .map((msg) => sanitizePrompt(msg.text || ''))
    .filter(Boolean);
}

function inferTopicLabel(text) {
  if (!text) return 'that';
  if (text.includes('jwt') || text.includes('auth')) return 'auth';
  if (text.includes('react') || text.includes('component')) return 'your React work';
  if (text.includes('mongo') || text.includes('mongoose')) return 'your database flow';
  if (text.includes('task') || text.includes('productivity')) return 'your workflow';
  if (text.includes('api') || text.includes('fetch')) return 'the API piece';
  if (text.includes('error') || text.includes('bug') || text.includes('debug')) return 'the issue';
  return 'that';
}

function toSentenceCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function extractTermFromPrompt(sanitizedPrompt) {
  if (!sanitizedPrompt) return '';
  const patterns = [
    /definition of (.+)/,
    /meaning of (.+?)( in hindi| in english)?$/,
    /what is (.+)/
  ];
  for (const pattern of patterns) {
    const match = sanitizedPrompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

/**
 * Resolves implicit follow-up prompts using recent history.
 */
function resolveFollowUpContext(sanitizedPrompt, history = []) {
  const truncatedHistory = limitHistory(history, 8);
  const lastUserMessage = getLastUserMessage(truncatedHistory);
  const lastUserPrompt = sanitizePrompt(lastUserMessage?.text || '');
  const lastUserIntent = classifyIntent(lastUserPrompt).intent;

  const followUpStarts = [
    'now',
    'also',
    'instead',
    'convert',
    'rewrite',
    'refactor',
    'optimize',
    'continue',
    'extend',
    'add',
    'make it',
    'show me',
    'turn it into'
  ];

  const isFollowUp =
    truncatedHistory.length > 0 &&
    (followUpStarts.some((phrase) => sanitizedPrompt.startsWith(phrase)) ||
      /\b(it|that|this|same one)\b/.test(sanitizedPrompt));

  return {
    isFollowUp,
    resolvedLanguage: detectLanguage(sanitizedPrompt, truncatedHistory),
    resolvedTopic: lastUserIntent === 'greeting' ? 'general' : lastUserIntent
  };
}

/**
 * 1. Factual generator
 */
export function factualGenerator(prompt, sanitized) {
  const match = lookupKnowledge(sanitized);
  if (match) {
    return `${match.content || match}`;
  }

  if (sanitized.includes('sex ratio of india')) {
    return `The sex ratio of India means the number of females per 1000 males.

In recent national estimates, India is around **1020 females per 1000 males**.`;
  }

  return `I don?t have a reliable local fact entry for that yet.

If you want, I can still give a practical explanation or a best-effort summary.`;
}

/**
 * 2. Coding generator
 */
export function codingGenerator(prompt, sanitized, lang) {
  let templateType = 'hello';
  let templateName = 'Hello World';
  let targetLanguage = lang || 'JavaScript';

  if (
    sanitized.includes('addition') ||
    sanitized.includes('add two') ||
    sanitized.includes('sum of')
  ) {
    templateType = 'addition';
    templateName = 'Addition of two numbers';
  } else if (
    sanitized.includes('api') ||
    sanitized.includes('fetch') ||
    sanitized.includes('request') ||
    sanitized.includes('ajax')
  ) {
    templateType = 'api';
    templateName = 'API fetch request';
  } else if (sanitized.includes('express') || sanitized.includes('server')) {
    templateType = 'expressServer';
    templateName = 'Express server setup';
    targetLanguage = 'JavaScript';
  } else if (
    sanitized.includes('mongodb') ||
    sanitized.includes('mongo') ||
    sanitized.includes('mongoose')
  ) {
    templateType = 'mongodbConnection';
    templateName = 'MongoDB connection';
    targetLanguage = 'JavaScript';
  } else if (
    sanitized.includes('jwt') ||
    sanitized.includes('middleware') ||
    sanitized.includes('auth')
  ) {
    templateType = 'jwtMiddleware';
    templateName = 'JWT auth middleware';
    targetLanguage = 'JavaScript';
  } else if (
    sanitized.includes('component') ||
    sanitized.includes('counter') ||
    sanitized.includes('button')
  ) {
    templateType = 'reactComponent';
    templateName = 'React component';
    targetLanguage = 'React/JSX';
  }

  let template = lookupTemplate(targetLanguage, templateType);
  if (!template && templateType !== 'hello') {
    template = lookupTemplate(targetLanguage, 'hello');
    templateName = 'Hello World';
  }

  const langKey = targetLanguage.toLowerCase() === 'react/jsx'
    ? 'jsx'
    : targetLanguage.toLowerCase() === 'html/css'
      ? 'html'
      : targetLanguage.toLowerCase();

  if (!template) {
    return `### Coding request

I can generate this, but I need one more detail: which language or framework do you want?

- Example: "write this in JavaScript"
- Example: "show a React version"
- Example: "make it Node + Express"`;
  }

  return `### ${targetLanguage} example

Here is a clean ${templateName.toLowerCase()} starter:

\`\`\`${langKey}
${template.code}
\`\`\`

Why this structure works:
- ${template.explanation}
- It stays small enough to adapt inside your existing project quickly.

If you want, I can rewrite it for another language or fit it to Nexus AI.`;
}

/**
 * 3. Debugging generator
 */
export function debuggingGenerator(prompt, sanitized) {
  let errorType = 'General runtime issue';
  let causes = [
    'A value is being read before it exists.',
    'A request or state update is finishing in a different order than expected.'
  ];
  let steps = [
    'Check the exact failing line in the browser console or server log.',
    'Log the variable or response shape immediately before the failure.'
  ];

  if (sanitized.includes('cors') || sanitized.includes('origin')) {
    errorType = 'CORS request block';
    causes = [
      'The backend CORS allowlist does not include the frontend origin.',
      'Credentials or headers do not match between frontend and backend.'
    ];
    steps = [
      'Add the Vite frontend URL to the backend CORS configuration.',
      'Make sure both sides agree on `credentials` and authorization headers.'
    ];
  } else if (sanitized.includes('null') || sanitized.includes('undefined')) {
    errorType = 'Undefined or null access';
    causes = [
      'The UI renders before async data has loaded.',
      'Nested properties are accessed without checking the parent object first.'
    ];
    steps = [
      'Use optional chaining such as `user?.profile?.name`.',
      'Render a loading or empty state until the data exists.'
    ];
  }

  return `### Debugging guide: ${errorType}

Likely causes:
1. ${causes[0]}
2. ${causes[1]}

Recommended next steps:
1. ${steps[0]}
2. ${steps[1]}
3. If you paste the exact error, I can narrow it down fast.`;
}

/**
 * 4. Productivity generator
 */
export function productivityGenerator(prompt, sanitized) {
  const planningPrompt = sanitized.includes('schedule') || sanitized.includes('plan');

  if (planningPrompt) {
    return `### Practical plan

- Identify the top 3 tasks that actually move the project forward.
- Do the hardest one first in a focused 45-minute block.
- Leave small cleanup work for the final block of the day.

If you want, I can turn your actual task list into a schedule.`;
  }

  return `### Productivity help

- Break the work into one clear outcome, one blocker, and one next action.
- Keep active tasks short enough to finish in a single sitting.
- Review what is stuck before adding new work.

I can also generate a checklist or sprint-style plan from your current priorities.`;
}

/**
 * 5. Analytics generator
 */
export function analyticsGenerator() {
  return `### Workspace Analytics

- Check latency, error rate, and usage trend first.
- Compare changes against the last release or deploy window.
- Look for one bottleneck before optimizing everything.

If you want, I can help you define the right metrics for Nexus AI.`;
}

/**
 * 6. Notes generator
 */
export function notesGenerator(prompt, sanitized) {
  const isSummary = sanitized.includes('summary') || sanitized.includes('meeting');
  const topicMatch = sanitized.match(/(?:on|about)\s+(.+)$/i);
  const noteTopic = topicMatch?.[1] ? toSentenceCase(topicMatch[1]) : '';

  if (isSummary) {
    return `### Summary template

- Topic:
- Key decisions:
- Open questions:
- Next actions:

If you share rough notes, I can turn them into a polished summary.`;
  }

  if (noteTopic) {
    return `### Notes: ${noteTopic}

- Goal: Capture a clear overview of ${noteTopic}.
- Core points:
- Practical example:
- Pitfalls to avoid:
- Next action:

If you want, I can fill this in with a complete first draft.`;
  }

  return `### Notes template

- Goal:
- Context:
- Important details:
- Decisions:
- Follow-up:

I can also draft this as a memo, spec, or meeting note.`;
}

/**
 * 7. Conversational generator
 */
export function conversationGenerator(prompt, sanitized, history = []) {
  const lastUserMessage = getLastUserMessage(history);
  const lastTopic = inferTopicLabel(sanitizePrompt(lastUserMessage?.text || ''));
  const recentTopics = getRecentUserTopics(history);
  const hasRecentContext = recentTopics.length > 0;

  if (sanitized.includes('your name') || sanitized.includes('who are you')) {
    return `I'm Nexus AI. I help with product work, debugging, coding, notes, and the day-to-day decisions around your workspace.

When cloud capacity is tight, this local layer keeps the conversation moving without losing the Nexus feel.`;
  }

  if (sanitized.includes('tell me about yourself')) {
    return `I'm Nexus AI, your workspace assistant for coding, debugging, planning, notes, and analytics.

I keep responses concise and useful, and I can switch between quick answers and deep technical help based on what you need.`;
  }

  if (sanitized.includes('how are you')) {
    return `Running clean in local mode and ready to help.

What are you working on right now?`;
  }

  if (sanitized.includes('thank')) {
    return `Anytime. Send the next prompt when you're ready and I'll keep the thread going.`;
  }

  if (sanitized.includes('what can you do') || sanitized.includes('can you help me')) {
    return `Quite a bit.

- I can write or improve code in your stack
- I can debug frontend and backend issues
- I can explain concepts without turning it into docs
- I can help with notes, plans, and product thinking

If you want, give me a real task and I'll jump in.`;
  }

  if (sanitized.includes('nice to meet you')) {
    return `Nice to meet you too.

What should we work on first?`;
  }

  if (sanitized.includes('who made you') || sanitized.includes('who created you')) {
    return `I'm part of Nexus AI, shaped for your SaaS workspace as a practical assistant rather than a generic chatbot.

The goal is simple: stay useful, fast, and consistent inside your product flow.`;
  }

  if (hasRecentContext) {
    if (sanitized.includes('okay') || sanitized.includes('ok') || sanitized === 'cool') {
      return `Alright. We can keep moving on ${lastTopic} whenever you want.`;
    }

    if (sanitized.includes('go on') || sanitized.includes('continue') || sanitized.includes('tell me more')) {
      return `Sure. I can go deeper on ${lastTopic}.

Do you want the simpler version, the technical version, or a practical example?`;
    }

    if (sanitized.includes('why')) {
      return `The short version is that it depends on the tradeoff around ${lastTopic}.

If you want, I can break down the reasoning step by step.`;
    }

    return `${toSentenceCase(lastTopic)} is still in view.

If you want, I can explain it more simply, show an example, or turn it into something actionable.`;
  }

  return `I'm here. Ask me a question, give me a task, or drop in a bug and I'll work through it with you.`;
}

export function identityGenerator() {
  return `I'm Nexus AI — your workspace and productivity assistant.

I help with code, debugging, notes, and day-to-day planning inside your flow.`;
}

export function translationGenerator(prompt, sanitized) {
  if (sanitized.includes('proud') && sanitized.includes('hindi')) {
    return `"Proud" in Hindi means **"गर्वित"** or **"गर्व महसूस करना"**.

Example:
"I am proud of you."
→ "मुझे तुम पर गर्व है।"`;
  }

  const translateMatch = sanitized.match(/translate (.+) to hindi/);
  if (translateMatch?.[1]) {
    const word = translateMatch[1].trim();
    if (word === 'hello') {
      return `"Hello" in Hindi is **"नमस्ते"**.

You can also say **"हैलो"** in casual contexts.`;
    }
    return `For "${word}", I can help translate it to Hindi.

If you want exact nuance (formal or casual), share the full sentence too.`;
  }

  return `I can translate that.

Tell me the exact word or sentence and the target language (for example: Hindi, English, Spanish).`;
}

export function definitionGenerator(prompt, sanitized) {
  const term = extractTermFromPrompt(sanitized);
  if (term === 'proud') {
    return `Proud means feeling happy and satisfied about an achievement, a quality, or someone you care about.`;
  }

  if (term === 'java') {
    return `Java is a popular programming language used to build applications, websites, Android apps, and enterprise software.`;
  }

  if (term === 'ai' || term === 'artificial intelligence') {
    return `AI (Artificial Intelligence) is technology that enables machines to perform tasks that usually require human intelligence, like understanding language, reasoning, and pattern recognition.`;
  }

  if (term === 'cloud computing') {
    return `Cloud computing means using remote internet-based servers for storage, processing, and software instead of relying only on your local machine.`;
  }

  if (sanitized.includes('sex ratio of india')) {
    return `The sex ratio of India refers to the number of females per 1000 males.

According to recent national estimates, India is around **1020 females per 1000 males**.`;
  }

  if (term) {
    return `${toSentenceCase(term)} is a concept you can understand by what it means, where it is used, and why it matters.

If you want, I can give you a very simple version with one real-world example.`;
  }

  return `Share the exact term and I'll define it clearly with an example.`;
}

/**
 * 8. General generator
 */
export function generalGenerator(prompt, toneName) {
  const tone = TONE_VARIATIONS[toneName] || TONE_VARIATIONS.friendly;
  const subject = prompt.replace(/^(how to|how do i|how can i)\s+/i, '').trim();

  if (/^(how to|how do i|how can i)\b/i.test(prompt) && subject) {
    return `${tone.intro}

For "${subject}", a solid starting point is:
- Focus on one proven path instead of chasing too many ideas.
- Build a repeatable habit or system around it.
- Measure what is actually working and adjust quickly.

If you want, I can make this advice specific to business, freelancing, career growth, or your SaaS.`;
  }

  const structures = [
    () => `${tone.intro}

I can help best if you make the request a little more specific.

${tone.bulletPrefix}Say what outcome you want
${tone.bulletPrefix}Mention the language, feature, or problem
${tone.bulletPrefix}Paste an error or example if there is one

${tone.outro}`,
    () => `${tone.intro}

Your prompt is broad enough that there are a few valid directions.

${tone.bulletPrefix}Ask for an explanation
${tone.bulletPrefix}Ask for a plan
${tone.bulletPrefix}Ask for code in a specific language

${tone.outro}`
  ];

  const selectedFunc = structures[lastFallbackStructureIdx % structures.length];
  lastFallbackStructureIdx += 1;
  return selectedFunc();
}

const GENERATOR_REGISTRY = {
  identity: () => identityGenerator(),
  translation: (prompt, sanitized) => translationGenerator(prompt, sanitized),
  definition: (prompt, sanitized) => definitionGenerator(prompt, sanitized),
  factual: (prompt, sanitized) => factualGenerator(prompt, sanitized),
  coding: (prompt, sanitized, ctx) => codingGenerator(prompt, sanitized, ctx.resolvedLanguage),
  debugging: (prompt, sanitized) => debuggingGenerator(prompt, sanitized),
  productivity: (prompt, sanitized) => productivityGenerator(prompt, sanitized),
  analytics: () => analyticsGenerator(),
  workspace: () => analyticsGenerator(),
  notes: (prompt, sanitized) => notesGenerator(prompt, sanitized),
  conversation: (prompt, sanitized, ctx, history) => conversationGenerator(prompt, sanitized, history)
};

/**
 * Routes prompts to correct generators and caches responses.
 */
export async function routeLocalIntelligence(prompt, history = []) {
  const cacheKey = buildCacheKey(prompt, history);
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  const sanitized = sanitizePrompt(prompt);
  const ctx = resolveFollowUpContext(sanitized, history);
  const classification = classifyIntent(sanitized);

  let activeIntent = classification.intent;
  if (
    ctx.isFollowUp &&
    activeIntent === 'general' &&
    ['coding', 'debugging', 'notes', 'productivity', 'analytics'].includes(ctx.resolvedTopic)
  ) {
    activeIntent = ctx.resolvedTopic;
  }

  const tones = Object.keys(TONE_VARIATIONS);
  const toneName = tones[Math.floor(Math.random() * tones.length)];

  const generatorPromise = new Promise((resolve) => {
    let responseText = '';

    if (GENERATOR_REGISTRY[activeIntent]) {
      responseText = GENERATOR_REGISTRY[activeIntent](prompt, sanitized, ctx, history);
    } else if (activeIntent === 'greeting') {
      responseText = history.length === 0
        ? `Hey. I'm Nexus AI.

What are we working on today?`
        : `Welcome back.

Pick up where you left off, or send the next question.`;
    } else {
      responseText = generalGenerator(prompt, toneName);
    }

    resolve(sanitizeMarkdown(responseText));
  });

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(`### Local mode timeout

That request took longer than expected to process locally. Try rephrasing it or make it a bit more specific.`);
    }, 2500);
  });

  const finalResponse = await Promise.race([generatorPromise, timeoutPromise]);

  if (isDev) {
    console.table({
      'Prompt Input': prompt.slice(0, 60),
      'Sanitized Prompt': sanitized.slice(0, 60),
      'Intent Route': activeIntent,
      'Confidence Score': classification.confidence.toFixed(2),
      'Language Context': ctx.resolvedLanguage || 'none',
      'Is Follow Up': ctx.isFollowUp,
      'Tone Template': toneName
    });
  }

  responseCache.set(cacheKey, finalResponse);
  return finalResponse;
}
