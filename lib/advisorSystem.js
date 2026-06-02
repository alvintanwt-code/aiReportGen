/**
 * Centralised LEET Advisory system prompt loader.
 *
 * Reads every .md file in `lib/knowledge/` in filename order and concatenates
 * them into a single cached system block. Use numeric prefixes
 * (01-..., 02-..., 03-...) to control load order.
 *
 * Current load order:
 *   01-advisor-system-prompt.md   — methodology / voice / reasoning hierarchy
 *   03-house-views.md             — current quantitative stances (quarterly)
 *
 * Prompt caching (Anthropic ephemeral cache) is enabled on the system block,
 * so the long prompt only pays the full read cost on the first request in a
 * ~5 minute window — subsequent requests reuse the cache at ~10% of the cost.
 *
 * To edit knowledge: drop or modify any .md file in `lib/knowledge/`, then
 * restart the dev server.
 */

import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'lib', 'knowledge');

let cachedKnowledge = null;
let cachedFilenames = null;

function loadKnowledge() {
  if (cachedKnowledge !== null) return cachedKnowledge;
  try {
    const files = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort(); // alphabetical => numeric-prefix order is respected

    cachedFilenames = files;

    const sections = files.map((filename) => {
      const text = fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), 'utf-8');
      return `<!-- knowledge: ${filename} -->\n\n${text.trim()}`;
    });

    cachedKnowledge = sections.join('\n\n---\n\n');
  } catch (err) {
    console.error('[advisorSystem] Failed to load knowledge:', err.message);
    cachedKnowledge = '';
    cachedFilenames = [];
  }
  return cachedKnowledge;
}

/**
 * The full concatenated knowledge text. Useful for debugging and for cases
 * where the SDK call needs a plain string instead of a system block.
 */
export function getAdvisorSystemText() {
  return loadKnowledge();
}

/**
 * Anthropic SDK-friendly `system` parameter value with prompt caching enabled.
 *
 * Pass to `messages.create({ system: getAdvisorSystemBlocks(), ... })` or to
 * `body.system` when calling the REST API directly.
 *
 * Optionally pass `extraSystemText` to append a task-specific addendum to the
 * same system block (e.g. "you are now in extraction mode, return JSON only").
 */
export function getAdvisorSystemBlocks(extraSystemText = null) {
  const base = loadKnowledge();
  const text = extraSystemText ? `${base}\n\n---\n\n${extraSystemText}` : base;
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

/**
 * Diagnostic info — useful for a debug endpoint to confirm what's loaded
 * without dumping the full text.
 */
export function getAdvisorSystemDiagnostics() {
  const text = loadKnowledge();
  return {
    files: cachedFilenames || [],
    totalChars: text.length,
    estimatedTokens: Math.round(text.length / 4),
  };
}
