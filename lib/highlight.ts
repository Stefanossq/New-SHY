/**
 * Syntax highlighting bundled from npm (core + only the languages we show) instead of
 * 7 CDN <script> tags — works offline in the desktop build and keeps the bundle small.
 */
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('plaintext', plaintext);

const EXTENSION_LANG: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  css: 'css', json: 'json', md: 'markdown', html: 'html', svg: 'xml', xml: 'xml',
  sql: 'sql', prisma: 'typescript', yml: 'yaml', yaml: 'yaml',
};

export const getFileLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_LANG[ext] ?? 'plaintext';
};

/** Returns HTML-escaped, highlighted markup (hljs escapes the source, so it is safe for innerHTML). */
export const highlightCode = (code: string, language: string): string => {
  try {
    return hljs.highlight(code, { language: hljs.getLanguage(language) ? language : 'plaintext', ignoreIllegals: true }).value;
  } catch {
    return hljs.highlight(code, { language: 'plaintext' }).value;
  }
};
