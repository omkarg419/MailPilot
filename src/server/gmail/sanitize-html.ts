import "server-only";

/**
 * Strip dangerous markup from Gmail HTML before it reaches the client.
 * Styles are isolated in an iframe at render time; this removes scripts,
 * external resources, and document-level breakout attempts. Inline and
 * embedded `<style>` blocks are kept — they only apply inside the iframe.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";

  let out = html;

  // Remove tags that can execute code or load external resources.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*>/gi, "");
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  out = out.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
  out = out.replace(/<embed\b[^>]*>/gi, "");
  out = out.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "");
  out = out.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  out = out.replace(/<base\b[^>]*>/gi, "");

  // Drop document wrappers — content is injected into our iframe shell.
  out = out.replace(/<\/?html[^>]*>/gi, "");
  out = out.replace(/<\/?body[^>]*>/gi, "");

  // Remove inline event handlers and xmlns.
  out = out.replace(
    /\s(on\w+|xmlns)(?:=(["'])[\s\S]*?\2|=[^\s>]+)?/gi,
    "",
  );

  // Block javascript: and data: URLs on sensitive attributes.
  out = out.replace(
    /\s(href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[^"']*\2/gi,
    "",
  );

  return out.trim();
}
