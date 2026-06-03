import React, { useState } from "react";
import { AIPromptCard } from "../types";
import { Copy, Download, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { downloadCardFiles } from "../utils";

interface PromptCardProps {
  card: AIPromptCard;
  onDelete: (id: string) => void;
  onSelect: (card: AIPromptCard) => void;
}

export function PromptCard({ card, onDelete, onSelect }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadCardFiles(card);
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(true);
  };

  return (
    <div 
      id={`card-${card.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0d051c]/90 hover:bg-[#0c031a] transition-all duration-300 hover:border-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer"
      onClick={() => onSelect(card)}
    >
      {/* Image box */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#030107]/50 border-b border-white/5">
        <img 
          src={card.imageUrl} 
          alt={card.prompt} 
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Floating gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 z-10">
          <div className="flex justify-end gap-1.5">
            <button
              onClick={handleCopy}
              className="rounded-lg bg-zinc-900/90 hover:bg-purple-650/90 p-2 text-white/90 border border-white/10 backdrop-blur-md transition-colors duration-200"
              title="复制提示词"
            >
              {copied ? (
                <CheckCircle2 size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-zinc-900/90 hover:bg-purple-650/90 p-2 text-white/90 border border-white/10 backdrop-blur-md transition-colors duration-200"
              title="一键下载图片及提示词"
            >
              <Download size={15} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 backdrop-blur-xs">
              点击查看 AI 解析
            </span>
            <button
              onClick={handleDeleteTrigger}
              className="rounded-lg bg-red-650/90 hover:bg-red-600 p-1.5 text-white/90 transition-colors duration-200 cursor-pointer"
              title="删除卡片"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Custom Confirmation Overlay */}
        {confirmingDelete && (
          <div 
            className="absolute inset-0 bg-[#030107]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-2.5">
              <Trash2 className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-100">确认删除这张提示词？</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] leading-relaxed">删除后将无法从本地沙盒中恢复。</p>
            <div className="flex gap-2 mt-4 w-full px-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-red-650 hover:bg-red-650 text-white rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-red-950/40 cursor-pointer"
              >
                彻底删除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="flex flex-1 flex-col p-4.5 bg-[#0d051c]">
        {/* Prompt line (truncated) */}
        <p className="line-clamp-2 text-[13px] font-mono text-white/80 leading-relaxed antialiased mt-1" title={card.prompt}>
          &ldquo;{card.prompt}&rdquo;
        </p>
        
        {/* Tags line */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {card.tags.map((tag, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] uppercase font-bold text-purple-400 tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Date */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5 text-[11px] text-white/40">
          <span className="font-mono">{new Date(card.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            <Eye size={12} /> 详细
          </span>
        </div>
      </div>
    </div>
  );
}
