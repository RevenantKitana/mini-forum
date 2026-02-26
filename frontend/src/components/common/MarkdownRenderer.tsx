import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Decode HTML entities recursively to handle double-encoding
 */
function decodeHtmlEntities(text: string): string {
  let decoded = text;
  let prevDecoded = '';
  
  // Keep decoding until no more changes (handles double/triple encoding)
  while (decoded !== prevDecoded) {
    prevDecoded = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x22;/g, '"');
  }
  
  return decoded;
}

/**
 * Simple Markdown renderer that handles basic formatting
 * Supports: **bold**, *italic*, `code`, # headings, - lists, > quotes, [links](url)
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // Decode HTML entities first (handles double-encoding)
    let html = decodeHtmlEntities(content);

    // Escape HTML to prevent XSS (only escape dangerous characters)
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (```) - handle before inline code
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code class="text-sm">${code.trim()}</code></pre>`;
    });

    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Headers (# ## ###)
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1.5">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-3 mb-1.5">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-3 mb-1.5">$1</h1>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~([^~]+)~~/g, '<del class="line-through">$1</del>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');

    // Blockquotes (> text)
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground/30 pl-4 my-1.5 text-muted-foreground italic">$1</blockquote>');

    // Unordered lists (- item or * item)
    html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // Wrap consecutive li tags in ul
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      return `<ul class="my-1.5 space-y-0.5">${match}</ul>`;
    });

    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

    // Horizontal rule (--- or ***)
    html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="my-3 border-muted" />');

    // Line breaks - convert double newlines to paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map((p) => {
        // Don't wrap if already a block element
        if (p.match(/^<(h[1-6]|pre|ul|ol|blockquote|hr)/)) {
          return p;
        }
        // Convert single newlines to <br> within paragraphs
        const withBreaks = p.replace(/\n/g, '<br />');
        return `<p class="mb-2">${withBreaks}</p>`;
      })
      .join('');

    return html;
  }, [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
