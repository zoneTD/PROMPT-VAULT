import React, { useState, useEffect } from "react";
import { AIPromptCard, AIPromptCollection } from "../types";
import { X, Copy, Download, Trash2, CheckCircle2, Globe, Clock, ShieldCheck, Folder, Sparkles, Sliders } from "lucide-react";
import { downloadCardFiles } from "../utils";

interface CardDetailModalProps {
  card: AIPromptCard | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateTags?: (id: string, newTags: string[]) => void;
  onUpdateCard?: (updatedCard: AIPromptCard) => void;
  collections?: AIPromptCollection[];
  onToggleCollection?: (cardId: string, collectionId: string) => void;
}

export function CardDetailModal({ 
  card, 
  onClose, 
  onDelete, 
  onUpdateTags,
  onUpdateCard,
  collections = [],
  onToggleCollection
}: CardDetailModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedSingleAi, setCopiedSingleAi] = useState(false);
  const [copiedSkill, setCopiedSkill] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedSingleAiPrompt, setEditedSingleAiPrompt] = useState("");
  const [editedSkillPrompt, setEditedSkillPrompt] = useState("");
  const [editedTargetModel, setEditedTargetModel] = useState("");

  // Sync edits state when card changes
  useEffect(() => {
    if (card) {
      setEditedPrompt(card.prompt || "");
      setEditedDescription(card.description || "");
      setEditedSingleAiPrompt(card.singleAiPrompt || "");
      setEditedSkillPrompt(card.skillPrompt || "");
      setEditedTargetModel(card.targetModel || "Midjourney v6");
      setIsEditing(false);
    }
  }, [card]);

  if (!card) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(card.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyDesc = () => {
    if (card.description) {
      navigator.clipboard.writeText(card.description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const handleCopySingleAi = () => {
    if (card.singleAiPrompt) {
      navigator.clipboard.writeText(card.singleAiPrompt);
      setCopiedSingleAi(true);
      setTimeout(() => setCopiedSingleAi(false), 2000);
    }
  };

  const handleCopySkill = () => {
    if (card.skillPrompt) {
      navigator.clipboard.writeText(card.skillPrompt);
      setCopiedSkill(true);
      setTimeout(() => setCopiedSkill(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadCardFiles(card);
  };

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        id="detail-modal"
        className="relative w-full max-w-5xl rounded-2xl bg-[#070311] border border-purple-500/20 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Large Image */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden h-[40vh] md:h-auto">
          <img 
            src={card.imageUrl} 
            alt={card.prompt} 
            className="w-full h-full object-contain max-h-[45vh] md:max-h-[75vh]"
            referrerPolicy="no-referrer"
          />
          {/* Subtle logo or overlay */}
          <div className="absolute top-4 left-4 bg-[#070311]/95 border border-purple-500/15 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white/80 font-mono tracking-wider flex items-center gap-1.5 shadow-lg">
            <ShieldCheck size={12} className="text-purple-400" /> CLIENT CRYPT VAULT
          </div>
        </div>

        {/* Right Side: Detailed Info Panel */}
        <div className="w-full md:w-[450px] flex flex-col border-l border-white/5 bg-[#070311] overflow-y-auto">
          {/* Header with edit toggling options */}
          <div className="sticky top-0 bg-[#070311] p-4 border-b border-white/5 flex items-center justify-between z-10">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 text-base">
              <Globe size={18} className="text-purple-400" />
              <span className="uppercase tracking-wider font-bold text-xs text-white/50">图集详细解析</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`py-1 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isEditing
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-white/5 text-slate-350 border-white/5 hover:bg-white/10"
                }`}
              >
                {isEditing ? "取消编辑" : "📝 编辑修改"}
              </button>
              <button 
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {isEditing ? (
            /* ==============================================
               EDIT MODE LAYOUT
               ============================================== */
            <div className="flex-1 p-6 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 leading-normal mb-1.5 font-normal">
                💡 正在进入本地编辑模式。您可以任意修改该提示词卡片的所有属性（绘图提示词、描述说明、AI特定指令、SKILL快捷技能或适用模型）。
              </div>

              {/* Edit Model */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎯 适用的 AI 模型名称</label>
                <input
                  type="text"
                  value={editedTargetModel}
                  onChange={(e) => setEditedTargetModel(e.target.value)}
                  placeholder="如 Midjourney v6、FLUX.1、Stable Diffusion 3"
                  className="w-full bg-[#130728] border border-purple-500/10 focus:border-purple-500/40 rounded-xl py-2 px-3 text-xs text-white placeholder-white/20 focus:outline-none font-mono"
                />
              </div>

              {/* Edit Draw Prompt */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI 绘图提示词 (PROMPT)</label>
                <textarea
                  rows={4}
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full bg-[#130728] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-white focus:outline-none font-mono leading-relaxed"
                />
              </div>

              {/* Edit AI Image Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI 图像分析描述</label>
                <textarea
                  rows={2}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="输入图像风格细节和内容描述..."
                  className="w-full bg-[#130728] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* Edit Single AI Prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-400 uppercase block tracking-wider">🤖 单个 AI 提示词 / 系统主指令</label>
                <textarea
                  rows={3}
                  value={editedSingleAiPrompt}
                  onChange={(e) => setEditedSingleAiPrompt(e.target.value)}
                  placeholder="在此输入生成本提示词所采用的 AI 主脑或系统 System Prompt..."
                  className="w-full bg-[#130728] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-mono leading-relaxed"
                />
              </div>

              {/* Edit SKILL style prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyan-400 uppercase block tracking-wider">⚡ SKILL 提示词 / 高级个性化技能组</label>
                <textarea
                  rows={3}
                  value={editedSkillPrompt}
                  onChange={(e) => setEditedSkillPrompt(e.target.value)}
                  placeholder="在此输入所选用的 SKILL 提示词组..."
                  className="w-full bg-[#130728] border border-purple-500/10 focus:border-cyan-500/40 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-mono leading-relaxed"
                />
              </div>

              {/* Action buttons inside edit panel */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const hasPrompt = editedPrompt.trim().length > 0;
                    const hasSingle = editedSingleAiPrompt.trim().length > 0;
                    const hasSkill = editedSkillPrompt.trim().length > 0;

                    if (!hasPrompt && !hasSingle && !hasSkill) {
                      alert("请至少填入“AI 绘图提示词”、“单个 AI 提示词”或“SKILL 提示词”中的任意一项以进行保存！");
                      return;
                    }
                    if (onUpdateCard) {
                      onUpdateCard({
                        ...card,
                        prompt: editedPrompt.trim() || "(无绘图提示词)",
                        description: editedDescription.trim() || undefined,
                        singleAiPrompt: editedSingleAiPrompt.trim() || undefined,
                        skillPrompt: editedSkillPrompt.trim() || undefined,
                        targetModel: editedTargetModel.trim() || undefined
                      });
                      setIsEditing(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  💾 保存修改信息
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-350 rounded-xl text-xs font-bold transition-all border border-white/5"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            /* ==============================================
               VIEW MODE LAYOUT
               ============================================== */
            <div className="flex-1 p-6 space-y-5">
              {/* Generation Date / Meta */}
              <div className="flex items-center gap-4 text-xs text-white/50 font-mono bg-[#130728] p-3 rounded-xl border border-purple-500/10 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-white/30" />
                  <span>{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="w-px h-3 bg-white/10"></div>
                <span>ID: {card.id.substring(0, 8)}</span>
              </div>

              {/* Model info badge */}
              <div className="flex items-center gap-2 text-xs bg-purple-500/5 border border-purple-500/15 px-3.5 py-2.5 rounded-xl text-purple-400 font-mono">
                <span className="font-bold text-[10px] text-purple-300 uppercase tracking-wide">🎯 适用模型:</span>
                <span className="font-semibold text-slate-100">{card.targetModel || "未指定模型 (默认多用途)"}</span>
              </div>

              {/* Prompt Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">AI 绘图提示词 (PROMPT)</label>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span className="text-[11px]">复制</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#130728] rounded-xl border border-purple-500/10 p-4 shadow-sm font-mono text-xs text-slate-200 leading-relaxed selection:bg-purple-550/30 whitespace-pre-wrap select-text break-words">
                  {card.prompt}
                </div>
              </div>

              {/* AI Description (if available) */}
              {card.description && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">AI 图像分析描述</label>
                    <button
                      onClick={handleCopyDesc}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                    >
                      {copiedDesc ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#130728]/50 rounded-xl border border-purple-500/10 p-4 text-xs text-white/70 leading-relaxed antialiased">
                    {card.description}
                  </div>
                </div>
              )}

              {/* Single AI Prompt Block (if available) */}
              {card.singleAiPrompt && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-purple-400 tracking-widest uppercase flex items-center gap-1">
                      <span>🤖 单个 AI 提示词 / 系统指令</span>
                    </label>
                    <button
                      onClick={handleCopySingleAi}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                    >
                      {copiedSingleAi ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制指令</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-purple-950/10 rounded-xl border border-purple-500/15 p-4 shadow-sm font-mono text-xs text-purple-200 leading-relaxed selection:bg-purple-550/30 whitespace-pre-wrap select-text break-words">
                    {card.singleAiPrompt}
                  </div>
                </div>
              )}

              {/* SKILL Prompt Block (if available) */}
              {card.skillPrompt && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-1">
                      <span>⚡ SKILL 提示词 / 专属技能规则</span>
                    </label>
                    <button
                      onClick={handleCopySkill}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                    >
                      {copiedSkill ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制SKILL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-cyan-950/10 rounded-xl border border-cyan-500/15 p-4 shadow-sm font-mono text-xs text-cyan-200 leading-relaxed selection:bg-cyan-500/35 whitespace-pre-wrap select-text break-words">
                    {card.skillPrompt}
                  </div>
                </div>
              )}

              {/* Tags Box */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase block mb-1">
                  精准分类标签 (可手动点击删除/在最后直接回车增加)
                </label>

                <div className="flex flex-wrap gap-2 items-center bg-[#130728]/40 border border-purple-500/10 p-3 rounded-xl min-h-[46px]">
                  {card.tags.map((tag, idx) => {
                    let prefixInfo = "🏷️ 其它";
                    let badgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                    if (idx === 0) {
                      prefixInfo = "💎 主体";
                      badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    } else if (idx === 1) {
                      prefixInfo = "🌍 主题";
                      badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                    } else if (idx === 2) {
                      prefixInfo = "🎭 风格";
                      badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    }

                    return (
                      <span 
                        key={idx}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${badgeStyle} shadow-2xs animate-scale-in`}
                      >
                        <span className="text-[9px] opacity-70 font-medium tracking-wide">{prefixInfo}:</span>
                        <span>#{tag}</span>
                        {onUpdateTags && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = card.tags.filter(t => t !== tag);
                              onUpdateTags(card.id, newTags);
                            }}
                            className="ml-1 px-1.5 text-sm text-slate-400 hover:text-red-400 font-bold leading-none cursor-pointer transition-colors"
                            title="删除该标签"
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    );
                  })}

                  {/* Inline direct add input */}
                  {onUpdateTags && (
                    <input
                      type="text"
                      placeholder="+ 回车新增"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const val = target.value.trim().replace(/#/g, "");
                          if (val && !card.tags.includes(val)) {
                            onUpdateTags(card.id, [...card.tags, val]);
                            target.value = "";
                          }
                        }
                      }}
                      className="bg-[#070311]/85 hover:bg-[#070311] border border-purple-500/10 rounded-md px-2.5 py-1 text-xs text-white/70 hover:text-white placeholder-white/20 hover:border-white/10 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-550/20 w-24 font-mono transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Custom Collections Selector */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase block">
                  所属自定义合集 (分类子文件夹)
                </label>
                
                {collections.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic bg-[#130728]/30 border border-purple-500/10 p-3 rounded-xl">
                    暂无可用自定义文件夹合集。可在左主控面板快速新建子合集。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar bg-[#130728]/30 border border-purple-500/10 rounded-xl p-2.5">
                    {collections.map((coll) => {
                      const isInCollection = coll.cardIds.includes(card.id);
                      return (
                        <button
                          key={coll.id}
                          type="button"
                          onClick={() => onToggleCollection?.(card.id, coll.id)}
                          className={`flex items-center gap-2 text-left px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            isInCollection
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold"
                              : "bg-[#070311]/55 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <Folder size={12} className={isInCollection ? "text-purple-400 fill-purple-400/20 animate-pulse" : "text-slate-500"} />
                          <span className="truncate flex-1">{coll.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="p-4 bg-[#070311] border-t border-white/5 sticky bottom-0 z-10 transition-all">
            {confirmingDelete ? (
              <div className="bg-red-950/15 border border-red-500/20 p-3 rounded-xl flex flex-col gap-2.5 animate-scale-in">
                <p className="text-[11px] text-red-400 font-bold flex items-center gap-1.5 leading-tight">
                  <Trash2 size={13} className="text-red-400 animate-bounce" />
                  <span>您确实要彻底删除该卡片及所有关联信息吗？</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 py-1.5 bg-[#130728] hover:bg-[#1C1C22] text-slate-300 rounded-lg text-xs font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      onDelete(card.id);
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-red-650 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    确认彻底删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  className="col-span-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-650 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition-all transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  <span>一键下载</span>
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="col-span-1 py-2.5 px-4 bg-transparent border border-red-500/20 hover:bg-red-955/20 text-red-500/90 hover:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>删除记录</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
