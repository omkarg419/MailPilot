"use client";

import { useEffect, useMemo, useRef } from "react";

function buildEmailSrcDoc(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank" rel="noopener noreferrer">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    overflow-x: auto;
  }
  body {
    font: 13px/1.625 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: oklch(0.986 0.002 67.8);
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  img, video, svg {
    max-width: 100% !important;
    height: auto !important;
  }
  table {
    max-width: 100% !important;
    table-layout: fixed;
  }
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  a {
    color: oklch(0.769 0.188 70.08);
  }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

type EmailBodyProps = {
  html: string;
};

export function EmailBody({ html }: EmailBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => buildEmailSrcDoc(html), [html]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const height = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
      );
      iframe.style.height = `${height}px`;
    };

    iframe.addEventListener("load", resize);
    return () => iframe.removeEventListener("load", resize);
  }, [srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      title="Email message"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      className="block w-full min-h-24 border-0 bg-transparent"
    />
  );
}
