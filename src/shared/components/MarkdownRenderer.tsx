'use client';

import React from 'react';

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-200">$1</em>')
    .replace(/`(.+?)`/g, '<code class="font-mono text-cyan-400 bg-slate-800/60 px-1 rounded text-[0.7em]">$1</code>');
}

interface Props {
  text: string;
  className?: string;
}

export function MarkdownRenderer({ text, className = '' }: Props) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="text-amber-400 font-semibold text-sm mt-4 mb-1.5 first:mt-0 border-b border-amber-500/20 pb-1">
          {line.replace(/^## /, '')}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key++} className="text-cyan-400 font-medium text-xs mt-3 mb-1">
          {line.replace(/^### /, '')}
        </h4>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^[-*] /, '');
      elements.push(
        <li key={key++} className="flex gap-2 text-xs text-slate-300 leading-relaxed ml-2">
          <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
        </li>
      );
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={key++} className="text-white font-semibold text-xs mt-2">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.trim() === '' || line.trim() === '---') {
      elements.push(<div key={key++} className="h-1" />);
    } else if (line.trim()) {
      elements.push(
        <p key={key++} className="text-xs text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}
