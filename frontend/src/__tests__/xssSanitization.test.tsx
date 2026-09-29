import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

describe('Phase 4 Frontend Security: DOMPurify XSS Sanitization in MarkdownRenderer', () => {
  it('SEC-03: should strip <script>alert(1)</script> and never execute script tags', () => {
    const maliciousInput = 'Hello World <script>alert("XSS")</script> Test';
    const { container } = render(<MarkdownRenderer content={maliciousInput} />);

    // Ensure script tags are stripped
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).not.toContain('alert(');
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
  });

  it('should strip onerror, onload, and inline event handlers from img tags', () => {
    const maliciousInput = '<img src="invalid.png" onerror="alert(1)" onload="alert(2)" alt="Hacked Image" />';
    const { container } = render(<MarkdownRenderer content={maliciousInput} />);

    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
      expect(img.getAttribute('onload')).toBeNull();
    }
    expect(container.innerHTML).not.toContain('onerror');
    expect(container.innerHTML).not.toContain('alert(1)');
  });

  it('should strip javascript: pseudo-protocols from markdown links', () => {
    const maliciousInput = '[Click here to win](javascript:alert(document.cookie))';
    const { container } = render(<MarkdownRenderer content={maliciousInput} />);

    const anchor = container.querySelector('a');
    if (anchor) {
      const href = anchor.getAttribute('href') || '';
      expect(href).not.toMatch(/^javascript:/i);
    }
    expect(container.innerHTML).not.toContain('javascript:');
    expect(container.innerHTML).not.toContain('document.cookie');
  });

  it('should strip <iframe>, <object>, <embed> tags', () => {
    const maliciousInput = 'Paragraph with <iframe src="https://evil.com"></iframe> and <embed src="evil.swf" />';
    const { container } = render(<MarkdownRenderer content={maliciousInput} />);

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('embed')).toBeNull();
    expect(container.innerHTML).not.toContain('evil.com');
  });

  it('should safely render markdown formatting (bold, italic, code, headings, links, quotes, lists)', () => {
    const markdown = [
      '# Main Title',
      '## Subtitle',
      '**Bold text** and *italic text*',
      '`inline code`',
      '> A blockquote',
      '- List item 1',
      '- List item 2',
      '[Valid Link](https://example.com)',
      '![Image](https://example.com/pic.jpg)',
    ].join('\n');

    const { container } = render(<MarkdownRenderer content={markdown} />);

    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/pic.jpg');
  });
});
