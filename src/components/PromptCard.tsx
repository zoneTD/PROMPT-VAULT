import React, { useState } from "react";
import { AIPromptCard } from "../types";
import { Copy, Download, Trash2, Eye, CheckCircle2, GripVertical } from "lucide-react";
import { downloadCardFiles } from "../utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PromptCardProps {
  card: AIPromptCard;
  onDelete: (id: string) => void;
  onSelect: (card: AIPromptCard) => void;
  layoutMode?: "complete" | "compact";
}

export function PromptCard({ card, onDelete, onSelect, layoutMode = "complete" }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 55 : undefined,
  };

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

  if (layoutMode === "compact") {
    return (
      <div 
        id={`card-${card.id}`}
        ref={setNodeRef}
        style={style}
        className={`group relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-[#0d051c]/95 hover:bg-[#0c031a] transition-all duration-300 hover:border-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer ${
          isDragging ? "shadow-[0_0_30px_rgba(168,85,247,0.5)] border-purple-500/50" : ""
        }`}
        onClick={() => onSelect(card)}
      >
        {/* Tactile drag handle */}
        <div 
          {...attributes} 
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/70 hover:bg-purple-650 border border-white/10 text-white/70 hover:text-white transition-all cursor-grab active:cursor-grabbing backdrop-blur-md shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 duration-200"
          title="按住拖拽排序"
        >
          <GripVertical size={13} />
        </div>

        {/* Image */}
        <img 
          src={card.imageUrl} 
          alt={card.prompt} 
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover overlay for Compact Cards */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020005]/95 via-black/35 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 z-10">
          <div className="flex justify-end gap-1.5">
            <button
              onClick={handleCopy}
              className="rounded-lg bg-zinc-900/95 hover:bg-purple-650/90 p-1.5 text-white/95 border border-white/10 backdrop-blur-md transition-all duration-200"
              title="复制提示词"
            >
              {copied ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-zinc-900/95 hover:bg-purple-650/90 p-1.5 text-white/95 border border-white/10 backdrop-blur-md transition-all duration-200"
              title="一键下载图片和提示词"
            >
              <Download size={13} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-mono text-white/90 line-clamp-2 leading-relaxed tracking-wide antialiased">
              &ldquo;{card.prompt}&rdquo;
            </p>
            <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
              <span className="text-[9px] font-mono text-white/40">
                {new Date(card.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={handleDeleteTrigger}
                className="rounded-lg bg-red-650/95 hover:bg-red-600 p-1 text-white transition-colors duration-200"
                title="删除卡片"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Confirmation Overlays */}
        {confirmingDelete && (
          <div 
            className="absolute inset-0 bg-[#030107]/95 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center z-25 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mb-1.5">
              <Trash2 className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-slate-100">确认删除？</p>
            <div className="flex gap-1.5 mt-3 w-full px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-350 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id={`card-${card.id}`}
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0d051c]/90 hover:bg-[#0c031a] transition-all duration-300 hover:border-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer ${
        isDragging ? "shadow-[0_0_30px_rgba(168,85,247,0.5)] border-purple-500/50" : ""
      }`}
      onClick={() => onSelect(card)}
    >
      {/* Tactile drag handle - always visible on mobile/touch, hidden and fades in on desktop hover */}
      <div 
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/60 hover:bg-purple-650 border border-white/10 text-white/60 hover:text-white transition-all cursor-grab active:cursor-grabbing backdrop-blur-md shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 duration-200"
        title="按住拖拽排序"
      >
        <GripVertical size={13} />
      </div>

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
