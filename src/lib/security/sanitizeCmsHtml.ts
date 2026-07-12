const BLOCKED_TAGS = /<\s*\/?\s*(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select)\b[^>]*>/gi;
const EVENT_HANDLER_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_ATTRS = /\s(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi;
const DATA_URL_ATTRS = /\s(src)\s*=\s*("\s*data:text\/html[^"]*"|'\s*data:text\/html[^']*'|data:text\/html[^\s>]+)/gi;

export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  return html
    .replace(BLOCKED_TAGS, '')
    .replace(EVENT_HANDLER_ATTRS, '')
    .replace(JAVASCRIPT_URL_ATTRS, ' $1="#"')
    .replace(DATA_URL_ATTRS, ' $1="#"');
}
