/** Allow only same-origin relative paths for post-auth redirects. */
export function safeRedirectPath(url: string | undefined): string {
  if (!url) return "/";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return "/";
}
