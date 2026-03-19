import { useState, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { HelpCircle, Bold, Italic, Code, Link2, List, Quote, Heading1, Heading2, Copy, Check } from 'lucide-react';

interface MarkdownExample {
  syntax: string;
  result: string;
  icon?: React.ReactNode;
}

const markdownExamples: { category: string; examples: MarkdownExample[] }[] = [
  {
    category: 'Định dạng văn bản',
    examples: [
      { syntax: '**text**', result: '<strong>text</strong>', icon: <Bold className="h-4 w-4" /> },
      { syntax: '*text*', result: '<em>text</em>', icon: <Italic className="h-4 w-4" /> },
      { syntax: '~~text~~', result: '<del>text</del>' },
      { syntax: '`code`', result: '<code>code</code>', icon: <Code className="h-4 w-4" /> },
    ],
  },
  {
    category: 'Tiêu đề',
    examples: [
      { syntax: '# Heading 1', result: '<h1>Heading 1</h1>', icon: <Heading1 className="h-4 w-4" /> },
      { syntax: '## Heading 2', result: '<h2>Heading 2</h2>', icon: <Heading2 className="h-4 w-4" /> },
      { syntax: '### Heading 3', result: '<h3>Heading 3</h3>' },
    ],
  },
  {
    category: 'Links & Media',
    examples: [
      { syntax: '[text](url)', result: '<a href="url">text</a>', icon: <Link2 className="h-4 w-4" /> },
      { syntax: '![alt](image-url)', result: '<img src="url" alt="alt">' },
    ],
  },
  {
    category: 'Danh sách',
    examples: [
      { syntax: '- item 1\n- item 2', result: '• item 1\n• item 2', icon: <List className="h-4 w-4" /> },
      { syntax: '1. item 1\n2. item 2', result: '1. item 1\n2. item 2' },
    ],
  },
  {
    category: 'Khác',
    examples: [
      { syntax: '> quote', result: '<blockquote>quote</blockquote>', icon: <Quote className="h-4 w-4" /> },
      { syntax: '---', result: '<hr />' },
      { syntax: '```\ncode block\n```', result: '<pre>code block</pre>' },
    ],
  },
];

interface MarkdownGuideProps {
  variant?: 'button' | 'compact' | 'inline';
  className?: string;
}

export function MarkdownGuide({ variant = 'button', className }: MarkdownGuideProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <div className={className}>
        <div className="rounded-lg border p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Markdown</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>**bold**</span>
              <span className="font-bold">bold</span>
            </div>
            <div className="flex justify-between">
              <span>*italic*</span>
              <span className="italic">italic</span>
            </div>
            <div className="flex justify-between">
              <span>`code`</span>
              <code className="bg-muted px-1 rounded">code</code>
            </div>
            <div className="flex justify-between">
              <span>[link](url)</span>
              <span className="text-primary underline">link</span>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
                Xem thêm →
              </Button>
            </DialogTrigger>
            <MarkdownGuideContent />
          </Dialog>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className={`text-xs text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 ${className}`}>
            <HelpCircle className="h-3 w-3" />
            Markdown hỗ trợ
          </span>
        </DialogTrigger>
        <MarkdownGuideContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Hướng dẫn Markdown
        </Button>
      </DialogTrigger>
      <MarkdownGuideContent />
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted-foreground/10 transition-colors flex-shrink-0"
      title="Sao chép cú pháp"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

function MarkdownGuideContent() {
  return (
    <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4" />
          Hướng dẫn Markdown
        </DialogTitle>
        <DialogDescription className="text-xs">
          Markdown là ngôn ngữ đánh dấu đơn giản để định dạng văn bản
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {markdownExamples.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-sm mb-2">{category.category}</h3>
              <div className="space-y-1.5">
                {category.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-1.5 rounded-lg bg-muted/50"
                  >
                    {example.icon && (
                      <div className="flex-shrink-0 w-5">
                        {example.icon}
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <code className="text-xs bg-background px-1.5 py-0.5 rounded border font-mono whitespace-pre-wrap">
                        {example.syntax}
                      </code>
                      <div 
                        className="text-xs px-1.5 py-0.5"
                        dangerouslySetInnerHTML={{ __html: example.result }}
                      />
                    </div>
                    <CopyButton text={example.syntax} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Tips */}
          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold text-sm mb-1.5 text-blue-700 dark:text-blue-300">
              💡 Mẹo
            </h3>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
              <li>• Để xuống dòng, nhấn Enter 2 lần</li>
              <li>• Kết hợp nhiều định dạng: ***bold & italic***</li>
              <li>• Dùng 4 dấu cách để tạo code block</li>
              <li>• Escape ký tự đặc biệt với \</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
