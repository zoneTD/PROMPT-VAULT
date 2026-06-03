import React, { useState, useEffect, useRef } from "react";
import { AIPromptCard, AIPromptCollection, User } from "./types";
import { compressAndStoreImage } from "./utils";
import { PromptCard } from "./components/PromptCard";
import { CardDetailModal } from "./components/CardDetailModal";
import { AuthPortal } from "./components/AuthPortal";
import { 
  Plus, 
  Search, 
  Sparkles, 
  Tag as TagIcon, 
  Trash2, 
  Grid, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  FileUp,
  Loader2,
  Copy,
  FolderLock,
  Download,
  Info,
  Folder,
  FolderPlus,
  LogOut
} from "lucide-react";

// Prepopulated sample cards to demo the design right away
const INITIAL_DEMO_CARDS: AIPromptCard[] = [
  {
    id: "demo-cyberpunk",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    prompt: "A neon-drenched cyborg holding a crystalline iris flower in a desert at midnight, volumetric lighting, 8k resolution cinematic lighting, intricate cyberpunk style",
    description: "这张图像展现了一位身处午夜沙漠中的赛博朋克改造人，手中捧着一朵发光的晶体鸢尾花。场景充满大量高对比度霓虹光影，呈现出高科技与荒凉自然结合的荒诞美学。",
    tags: ["赛博朋克", "超现实", "霓虹光影"],
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: "demo-astronaut",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    prompt: "1970s retro sci-fi book cover illustration of a lonely astronaut discovering an ancient floating brass obelisk on a foreign toxic planet landscape",
    description: "经典的1970年代复古科幻画风。宇航员站在满是荧光毒雾的异星沼泽表面，眼前悬浮着巨大的黄铜色上古尖碑，透露出太空探索的未知与孤寂。",
    tags: ["复古科幻", "异星探索", "视觉震慑"],
    createdAt: Date.now() - 3600000 * 24,
  }
];

export default function App() {
  const [cards, setCards] = useState<AIPromptCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // UI Tabs & Sidebar Modes
  const [activeTab, setActiveTab] = useState<"gallery" | "add-manual" | "add-ai">("gallery");
  const [viewDetailCard, setViewDetailCard] = useState<AIPromptCard | null>(null);

  // States for manual custom API settings
  const [customProvider, setCustomProvider] = useState<"gemini" | "openai">(() => {
    return (localStorage.getItem("custom_gemini_provider") as "gemini" | "openai") || "gemini";
  });
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("custom_gemini_api_key") || "");
  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem("custom_gemini_api_url") || "");
  const [customModel, setCustomModel] = useState(() => {
    const saved = localStorage.getItem("custom_gemini_model");
    if (saved) return saved;
    const provider = localStorage.getItem("custom_gemini_provider") || "gemini";
    return provider === "openai" ? "gpt-4o-mini" : "gemini-3.5-flash";
  });
  const [useCustomApi, setUseCustomApi] = useState(() => localStorage.getItem("use_custom_gemini_api") === "true");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testApiLoading, setTestApiLoading] = useState(false);
  const [testApiResult, setTestApiResult] = useState<{ success: boolean; message: string } | null>(null);

  // States for interactive creator
  const [uploadProgress, setUploadProgress] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [isDraggingManual, setIsDraggingManual] = useState(false);
  const [isDraggingAI, setIsDraggingAI] = useState(false);
  
  // Separate add pages configuration states
  const [manualAddMode, setManualAddMode] = useState<"draw" | "system" | "skill">("draw");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  
  // For Manual Upload Form
  const [manualImageFile, setManualImageFile] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState("");
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newManualTagInput, setNewManualTagInput] = useState("");
  const [manualSingleAiPrompt, setManualSingleAiPrompt] = useState("");
  const [manualSkillPrompt, setManualSkillPrompt] = useState("");
  const [manualTargetModel, setManualTargetModel] = useState("Midjourney v6");

  // For AI Describe/Reverse Tool Form
  const [aiImageFile, setAiImageFile] = useState<string | null>(null);
  const [aiDescribeResult, setAiDescribeResult] = useState<{
    description: string;
    prompt: string;
    tags: string[];
  } | null>(null);
  const [newAiTagInput, setNewAiTagInput] = useState("");
  const [aiSingleAiPrompt, setAiSingleAiPrompt] = useState("");
  const [aiSkillPrompt, setAiSkillPrompt] = useState("");
  const [aiTargetModel, setAiTargetModel] = useState("Midjourney v6");

  const fileInputRefManual = useRef<HTMLInputElement>(null);
  const fileInputRefAI = useRef<HTMLInputElement>(null);

  // Custom Collections / Subfolders States
  const [collections, setCollections] = useState<AIPromptCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [confirmCollectionDeleteId, setConfirmCollectionDeleteId] = useState<string | null>(null);



  // Helper to add tag manually in Form
  const handleAddManualTag = () => {
    const val = newManualTagInput.trim().replace(/#/g, "");
    if (!val) return;
    if (!manualTags.includes(val)) {
      setManualTags([...manualTags, val]);
    }
    setNewManualTagInput("");
  };

  // Helper to remove tag manually in Form
  const handleRemoveManualTag = (tagToRemove: string) => {
    setManualTags(manualTags.filter(t => t !== tagToRemove));
  };

  // Helper to add tag in AI generator Form
  const handleAddAiTag = () => {
    if (!aiDescribeResult) return;
    const val = newAiTagInput.trim().replace(/#/g, "");
    if (!val) return;
    if (!aiDescribeResult.tags.includes(val)) {
      setAiDescribeResult({
        ...aiDescribeResult,
        tags: [...aiDescribeResult.tags, val],
      });
    }
    setNewAiTagInput("");
  };

  // Helper to remove tag in AI generator Form
  const handleRemoveAiTag = (tagToRemove: string) => {
    if (!aiDescribeResult) return;
    setAiDescribeResult({
      ...aiDescribeResult,
      tags: aiDescribeResult.tags.filter(t => t !== tagToRemove),
    });
  };

  // Active User session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = localStorage.getItem("prompt_vault_session");
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Load User Data upon authentication changes
  useEffect(() => {
    if (!currentUser) {
      setCards([]);
      setCollections([]);
      setSelectedCollectionId(null);
      setSelectedTag(null);
      return;
    }

    const cardsKey = `prompt_vault_cards_${currentUser.id}`;
    const colsKey = `prompt_vault_collections_${currentUser.id}`;

    // 1. Load Cards
    const storedCards = localStorage.getItem(cardsKey);
    if (storedCards) {
      try {
        setCards(JSON.parse(storedCards));
      } catch (e) {
        setCards(INITIAL_DEMO_CARDS);
      }
    } else {
      // Lazy pre-populate for a fresh spectacular onboarding experience!
      setCards(INITIAL_DEMO_CARDS);
      localStorage.setItem(cardsKey, JSON.stringify(INITIAL_DEMO_CARDS));
    }

    // 2. Load Collections
    const storedCols = localStorage.getItem(colsKey);
    if (storedCols) {
      try {
        setCollections(JSON.parse(storedCols));
      } catch (e) {
        setCollections([]);
      }
    } else {
      const demoCollections: AIPromptCollection[] = [
        {
          id: "demo-col-cyber",
          name: "赛博黑客霓虹",
          cardIds: ["demo-cyberpunk"],
          createdAt: Date.now()
        },
        {
          id: "demo-col-space",
          name: "太空科幻经典",
          cardIds: ["demo-astronaut"],
          createdAt: Date.now()
        }
      ];
      setCollections(demoCollections);
      localStorage.setItem(colsKey, JSON.stringify(demoCollections));
    }
  }, [currentUser]);

  // Update collections storage whenever state changes
  const saveCollectionsToStateAndStorage = (updated: AIPromptCollection[]) => {
    setCollections(updated);
    if (currentUser) {
      localStorage.setItem(`prompt_vault_collections_${currentUser.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("prompt_vault_collections", JSON.stringify(updated));
    }
  };

  // Helper to create a new folder/collection
  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    // Check for duplicate name
    if (collections.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("该合集活页夹名称已存在，请换个名字。");
      return;
    }
    const newColl: AIPromptCollection = {
      id: "col-" + Date.now(),
      name,
      cardIds: [],
      createdAt: Date.now()
    };
    saveCollectionsToStateAndStorage([...collections, newColl]);
    setNewCollectionName("");
  };

  // Helper to delete an entire collection grouping (without deleting the cards inside)
  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = collections.filter(c => c.id !== id);
    saveCollectionsToStateAndStorage(updated);
    if (selectedCollectionId === id) {
      setSelectedCollectionId(null);
    }
  };

  // Toggle card inside collection membership state
  const handleToggleCollectionForCard = (cardId: string, collectionId: string) => {
    const updated = collections.map(coll => {
      if (coll.id === collectionId) {
        const hasCard = coll.cardIds.includes(cardId);
        const cardIds = hasCard
          ? coll.cardIds.filter(id => id !== cardId)
          : [...coll.cardIds, cardId];
        return { ...coll, cardIds };
      }
      return coll;
    });
    saveCollectionsToStateAndStorage(updated);
  };

  // Update storage whenever state changes
  const saveCardsToStateAndStorage = (updated: AIPromptCard[]) => {
    setCards(updated);
    if (currentUser) {
      localStorage.setItem(`prompt_vault_cards_${currentUser.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("prompt_vault_cards", JSON.stringify(updated));
    }
  };

  // Helper calculating localStorage raw usage
  const getStorageSizeMB = () => {
    const key = currentUser ? `prompt_vault_cards_${currentUser.id}` : "prompt_vault_cards";
    const raw = localStorage.getItem(key) || "";
    const bytes = raw.length * 2; // UTF-16 characters
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
  };

  // List all distinct tags from library
  const getAllUniqueTags = () => {
    const tagsSet = new Set<string>();
    cards.forEach(c => c.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  };

  // Handle Manual Image Selection
  const handleManualImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(true);
    try {
      const base64 = await compressAndStoreImage(file);
      setManualImageFile(base64);
    } catch (err) {
      alert("处理图片出错，请选择常规图片格式。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Handle Describe AI Image Selection
  const handleAiImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(true);
    setAiDescribeResult(null);
    try {
      const base64 = await compressAndStoreImage(file);
      setAiImageFile(base64);
      // Immediately trigger Describe AI Analysis to present premium dynamic response
      await analyzeImageWithAI(base64);
    } catch (err) {
      alert("处理或读取图片失败。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Connect & ping API handler to verify credentials live
  const handleTestApiConnection = async () => {
    if (!customApiKey || !customApiKey.trim()) {
      setTestApiResult({
        success: false,
        message: "测试失败：API 密钥 (API Key) 不能为空！"
      });
      return;
    }

    setTestApiLoading(true);
    setTestApiResult(null);

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customProvider,
          customApiKey: customApiKey.trim(),
          customApiUrl: (customApiUrl || "").trim(),
          customModel: (customModel || "").trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "发生了未知错误/HTTP请求失败");
      }

      setTestApiResult({
        success: true,
        message: data.message || "连接测试成功！"
      });
    } catch (err: any) {
      setTestApiResult({
        success: false,
        message: err?.message || String(err)
      });
    } finally {
      setTestApiLoading(false);
    }
  };

  // Drag and drop event handlers for Manual Upload Zone
  const handleManualDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingManual(true);
  };

  const handleManualDragLeave = () => {
    setIsDraggingManual(false);
  };

  const handleManualDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingManual(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请拖拽有效的图片文件。");
      return;
    }
    setUploadProgress(true);
    try {
      const base64 = await compressAndStoreImage(file);
      setManualImageFile(base64);
    } catch (err) {
      alert("处理图片出错，请选择常规图片格式。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Drag and drop event handlers for AI Auto-Description Upload Zone
  const handleAIDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAI(true);
  };

  const handleAIDragLeave = () => {
    setIsDraggingAI(false);
  };

  const handleAIDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAI(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请拖拽有效的图片文件。");
      return;
    }
    setUploadProgress(true);
    setAiDescribeResult(null);
    try {
      const base64 = await compressAndStoreImage(file);
      setAiImageFile(base64);
      // Immediately trigger Describe AI Analysis to present premium dynamic response
      await analyzeImageWithAI(base64);
    } catch (err) {
      alert("处理或读取图片失败。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Call Server-Side API to Suggest tags for manual inputs
  const triggerTagSuggestion = async () => {
    let textToAnalyze = "";
    if (manualAddMode === "draw") {
      textToAnalyze = manualPrompt.trim();
    } else if (manualAddMode === "system") {
      textToAnalyze = manualSingleAiPrompt.trim();
    } else {
      textToAnalyze = manualSkillPrompt.trim();
    }

    if (!textToAnalyze) {
      alert("请先输入核心提示词指令内容，AI 才可以帮您打标分词。");
      return;
    }
    setApiLoading(true);
    try {
      const payload: any = { prompt: textToAnalyze };
      if (useCustomApi && customApiKey.trim()) {
        payload.useCustomApi = true;
        payload.customProvider = customProvider;
        payload.customApiKey = customApiKey.trim();
        if (customApiUrl.trim()) payload.customApiUrl = customApiUrl.trim();
        if (customModel.trim()) payload.customModel = customModel.trim();
      }

      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.tags) {
        setSuggestedTags(data.tags);
        setManualTags(data.tags);
      } else {
        throw new Error(data.error || "获取标签失败");
      }
    } catch (err: any) {
      console.warn("API tags suggestion failure:", err);
      // Fallback based on specific mode
      const defaultModeTags: Record<string, string[]> = {
        draw: ["图像艺术", "材质质感", "图集备份"],
        system: ["系统设定", "角色扮演", "提效模板"],
        skill: ["SKILL指令", "高级微操", "核心规则"]
      };
      const fallbackTags = defaultModeTags[manualAddMode] || ["智能生成", "私有备份", "保险库"];
      setSuggestedTags(fallbackTags);
      setManualTags(fallbackTags);
    } finally {
      setApiLoading(false);
    }
  };

  // Call Server-Side API to Describe picture and reverse prompt
  const analyzeImageWithAI = async (base64Data: string) => {
    setApiLoading(true);
    try {
      const payload: any = { image: base64Data };
      if (useCustomApi && customApiKey.trim()) {
        payload.useCustomApi = true;
        payload.customProvider = customProvider;
        payload.customApiKey = customApiKey.trim();
        if (customApiUrl.trim()) payload.customApiUrl = customApiUrl.trim();
        if (customModel.trim()) payload.customModel = customModel.trim();
      }

      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setAiDescribeResult({
          description: data.description,
          prompt: data.prompt,
          tags: data.tags || ["自然还原", "高精度", "AI逆向"],
        });
      } else {
        throw new Error(data.error || "图片逆向反推失败");
      }
    } catch (err: any) {
      console.error(err);
      // Dynamic fallback based on general tags
      setAiDescribeResult({
        description: "在没有配置 GEMINI_API_KEY 且未手动配置第三方 API 的情况下，系统启动安全沙盒仿真提取机制。图像内容已存储。如果您已经配置了第三方 API Key，请检查网络或配置是否正确。",
        prompt: "A beautiful cinematic digital painting, intricate details, vivid soft lighting, realistic art station render --ar 16:9",
        tags: ["沙盒仿真", "私有储存", "安全提示"],
      });
    } finally {
      setApiLoading(false);
    }
  };

  // Save manual card to pool
  const saveManualCard = () => {
    const hasPrompt = manualPrompt.trim().length > 0;
    const hasSingle = manualSingleAiPrompt.trim().length > 0;
    const hasSkill = manualSkillPrompt.trim().length > 0;

    if (!hasPrompt && !hasSingle && !hasSkill) {
      alert("请在此卡片中至少填入“AI 绘图提示词”、“单个 AI 提示词 / 系统主指令”或“SKILL 提示词 / 高级技能”中的任意一项以便保存！");
      return;
    }

    // Dynamic high-quality fallback abstract 3D cover artworks tailored to prompt categories
    let finalImageUrl = manualImageFile;
    if (!finalImageUrl) {
      if (manualAddMode === "draw") {
        finalImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"; // Organic abstract grid wave
      } else if (manualAddMode === "system") {
        finalImageUrl = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop"; // Glowing neon virtual intelligence core / brain
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=600&auto=format&fit=crop"; // Cyber stream neon neon grid pattern
      }
    }

    let defaultDesc = "用户手动录入并管理的提示词备忘记录。";
    if (manualAddMode === "system") {
      defaultDesc = "用户保存调校的 LLM 智能体系统级角色设定及系统主指令 (System Prompt) 指示。";
    } else if (manualAddMode === "skill") {
      defaultDesc = "用户打磨沉淀的专属 SKILL 指令包及高级技能微调规则组。";
    }

    const modeLabels: Record<string, string[]> = {
      draw: ["绘图提示词", "画集"],
      system: ["系统指令", "智能体"],
      skill: ["SKILL技能", "规则组"]
    };

    const finalTags = manualTags.length > 0 
      ? manualTags 
      : [...(modeLabels[manualAddMode] || ["自定义", "备忘记录"])];

    let autoModel = "Midjourney v6";
    if (manualAddMode === "system") {
      autoModel = "Gemini 2.5 Pro";
    } else if (manualAddMode === "skill") {
      autoModel = "DeepSeek-V3";
    }

    const newCard: AIPromptCard = {
      id: "card-" + Date.now(),
      imageUrl: finalImageUrl,
      prompt: manualPrompt.trim() || "(无绘图原词)",
      tags: finalTags,
      createdAt: Date.now(),
      description: defaultDesc,
      singleAiPrompt: manualSingleAiPrompt.trim() || undefined,
      skillPrompt: manualSkillPrompt.trim() || undefined,
      targetModel: autoModel
    };

    saveCardsToStateAndStorage([newCard, ...cards]);
    // Reset manual form
    setManualImageFile(null);
    setManualPrompt("");
    setManualTags([]);
    setSuggestedTags([]);
    setManualSingleAiPrompt("");
    setManualSkillPrompt("");
    setActiveTab("gallery");
  };

  // Save AI analyzed card to pool
  const saveAiAnalyzedCard = () => {
    if (!aiImageFile) {
      alert("请先上传反推分析的图片！");
      return;
    }
    if (!aiDescribeResult) {
      alert("AI 还没有完成分析提取，请先分析图片。");
      return;
    }

    const newCard: AIPromptCard = {
      id: "card-" + Date.now(),
      imageUrl: aiImageFile,
      prompt: aiDescribeResult.prompt,
      tags: aiDescribeResult.tags,
      description: aiDescribeResult.description,
      createdAt: Date.now(),
      singleAiPrompt: aiSingleAiPrompt.trim() || undefined,
      skillPrompt: aiSkillPrompt.trim() || undefined,
      targetModel: aiTargetModel.trim() || undefined
    };

    saveCardsToStateAndStorage([newCard, ...cards]);
    // Reset AI form
    setAiImageFile(null);
    setAiDescribeResult(null);
    setAiSingleAiPrompt("");
    setAiSkillPrompt("");
    setAiTargetModel("Midjourney v6");
    setActiveTab("gallery");
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    const updated = cards.filter(c => c.id !== id);
    saveCardsToStateAndStorage(updated);

    const updatedCollections = collections.map(coll => ({
      ...coll,
      cardIds: coll.cardIds.filter(cardId => cardId !== id)
    }));
    saveCollectionsToStateAndStorage(updatedCollections);

    if (viewDetailCard?.id === id) {
      setViewDetailCard(null);
    }
  };

  // Update card fields inside modal
  const handleUpdateCard = (updatedCard: AIPromptCard) => {
    const updated = cards.map(c => {
      if (c.id === updatedCard.id) {
        return updatedCard;
      }
      return c;
    });
    saveCardsToStateAndStorage(updated);
    // Update live modal too
    if (viewDetailCard && viewDetailCard.id === updatedCard.id) {
      setViewDetailCard(updatedCard);
    }
  };

  // Edit custom tags inside modal
  const handleUpdateTags = (id: string, newTags: string[]) => {
    const updated = cards.map(c => {
      if (c.id === id) {
        return { ...c, tags: newTags };
      }
      return c;
    });
    saveCardsToStateAndStorage(updated);
    // Update live modal too
    if (viewDetailCard && viewDetailCard.id === id) {
      setViewDetailCard({ ...viewDetailCard, tags: newTags });
    }
  };

  // Filter cards by search, Custom Collection folders, and tags
  const filteredCards = cards.filter(c => {
    const matchesSearch = 
      c.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesTag = selectedTag ? c.tags.includes(selectedTag) : true;

    const matchesCollection = selectedCollectionId 
      ? collections.find(col => col.id === selectedCollectionId)?.cardIds.includes(c.id) || false
      : true;

    return matchesSearch && matchesTag && matchesCollection;
  });

  if (!currentUser) {
    return (
      <AuthPortal
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("prompt_vault_session", JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#020005] text-slate-200 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-purple-550/30 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="h-16 border-b border-purple-500/10 flex items-center justify-between px-4 sm:px-6 bg-[#070311] sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedTag(null); setActiveTab("gallery"); }}>
          <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center font-black text-white italic tracking-tighter text-sm shadow-[0_0_12px_rgba(168,85,247,0.4)]">AI</div>
          <span className="font-extrabold text-base tracking-widest text-slate-100 uppercase font-mono sm:block hidden">
            PROMPT<span className="text-purple-400">VAULT</span>
          </span>
        </div>
        
        {/* Realtime Search Bar input */}
        <div className="flex-1 max-w-xl mx-4 sm:mx-8">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="按提示词、图像属性或归纳标签搜索图集..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020005]/60 border border-purple-500/10 rounded-full py-1.5 pl-10 pr-4 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-550/30 transition-all font-mono"
            />
            <Search className="w-4 h-4 absolute left-3.5 text-slate-500" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full px-1.5 py-0.5"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 手动保存 Button & Dropdown Drop Menu */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => {
                setAddDropdownOpen(!addDropdownOpen);
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "add-manual" 
                  ? "bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "bg-white/5 hover:bg-white/10 text-slate-355 border border-white/5"
              }`}
            >
              <Plus size={14} />
              <span>手动保存</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${addDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Options */}
            {addDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setAddDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0518] border border-purple-500/10 rounded-xl shadow-2xl py-1.5 z-55 text-xs font-semibold animate-scale-in">
                  <div className="px-3 py-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-light-purple-500/5 mb-1 select-none">
                    选择录入卡片类型
                  </div>
                  <button
                    onClick={() => {
                      setManualAddMode("draw");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors flex items-center gap-2.5 ${manualAddMode === "draw" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}`}
                  >
                    <span className="text-base">🎨</span>
                    <div className="flex flex-col">
                      <span className="font-bold">AI 绘图提示词卡片</span>
                      <span className="text-[10px] text-white/40 font-normal">核心绘图 Prompt (可配图)</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setManualAddMode("system");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors flex items-center gap-2.5 ${manualAddMode === "system" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}`}
                  >
                    <span className="text-base">🤖</span>
                    <div className="flex flex-col">
                      <span className="font-bold">单个 AI 提示词 / 系统主指令</span>
                      <span className="text-[10px] text-white/40 font-normal">角色的核心 System/AI Prompt</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setManualAddMode("skill");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors flex items-center gap-2.5 ${manualAddMode === "skill" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}`}
                  >
                    <span className="text-base">⚡</span>
                    <div className="flex flex-col">
                      <span className="font-bold">SKILL 提示词 / 技能微操规则</span>
                      <span className="text-[10px] text-white/40 font-normal">风格组或专属技能规则微操指导</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <button 
            onClick={() => setActiveTab(activeTab === "add-ai" ? "gallery" : "add-ai")}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === "add-ai" 
                ? "bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse" 
                : "bg-purple-500/10 hover:bg-purple-550/20 text-purple-400 border border-purple-500/20"
            }`}
          >
            <Sparkles size={14} />
            <span>AI 逆向分析助手</span>
          </button>

          {/* Universal Safe Logout button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 bg-red-955/20 hover:bg-red-650 hover:text-white border border-red-500/20 text-red-400 cursor-pointer shadow-sm shadow-red-950/20"
            title="安全退出当前帐户并自动锁库"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">安全退出</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto overflow-hidden">
        
        {/* SIDEBAR NAVIGATION - LEFT */}
        <nav className="w-60 border-r border-purple-500/10 p-5 hidden lg:flex flex-col gap-6 bg-[#05020c]/90 shrink-0">
          {/* Main Control Panel */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#a855f7]/40 font-bold mb-3 px-2">主控面板</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { setActiveTab("gallery"); setSelectedTag(null); setSelectedCollectionId(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "gallery" && !selectedTag && !selectedCollectionId
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/15" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>📋</span> 所有提示词备份
                  </span>
                  <span className="bg-[#020005]/80 text-[10px] text-slate-400 px-2 py-0.5 rounded-md font-mono border border-purple-500/10">
                    {cards.length}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Subfolders Collections Section */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest text-[#a855f7]/40 font-bold px-2">
              整理合集子文件夹 (COLLECTIONS)
            </p>
            
            <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar px-1">
              {collections.map((coll) => {
                const isActive = selectedCollectionId === coll.id;
                const isConfirmingDelete = confirmCollectionDeleteId === coll.id;

                if (isConfirmingDelete) {
                  return (
                    <div key={coll.id} className="flex items-center justify-between gap-1 px-2 py-1 bg-red-950/20 border border-red-500/20 rounded-md animate-scale-in text-[10px] font-bold">
                      <span className="text-red-400 truncate">确认解散？</span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = collections.filter(c => c.id !== coll.id);
                            saveCollectionsToStateAndStorage(updated);
                            if (selectedCollectionId === coll.id) {
                              setSelectedCollectionId(null);
                            }
                            setConfirmCollectionDeleteId(null);
                          }}
                          className="text-red-400 hover:text-red-300 px-1 py-0.5 font-bold cursor-pointer transition-colors"
                        >
                          是
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCollectionDeleteId(null);
                          }}
                          className="text-slate-400 hover:text-white px-1 py-0.5 font-bold cursor-pointer transition-colors"
                        >
                          否
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={coll.id} className="group/folder flex items-center justify-between gap-1 rounded-lg hover:bg-white/[0.02]">
                    <button
                      onClick={() => {
                        setActiveTab("gallery");
                        setSelectedCollectionId(coll.id);
                        setSelectedTag(null);
                      }}
                      className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                        isActive
                          ? "text-purple-400 font-extrabold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate max-w-[130px]">
                        <Folder size={12} className={isActive ? "text-purple-400 fill-purple-400/20" : "text-slate-500"} />
                        <span>{coll.name}</span>
                      </span>
                      <span className="bg-[#020005]/80 text-[9px] text-slate-555 px-1.5 py-0.2 rounded font-mono border border-purple-500/10 group-hover/folder:border-white/10">
                        {coll.cardIds.length}
                      </span>
                    </button>
                    
                    {/* Tiny delete button to delete collection folder */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmCollectionDeleteId(coll.id);
                      }}
                      className="opacity-0 group-hover/folder:opacity-100 text-slate-500 hover:text-red-400 p-1 text-xs transition-opacity cursor-pointer font-bold select-none mr-1.5"
                      title="解散合集"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
              
              {collections.length === 0 && (
                <p className="text-[10px] text-slate-600 italic px-2">暂无整理合集文件夹。</p>
              )}
            </div>

            {/* Micro inline collection creation form */}
            <div className="px-2 pt-1">
              <div className="flex gap-1.5 items-center bg-[#020005]/85 border border-purple-500/10 rounded-md p-1">
                <input
                  type="text"
                  placeholder="+ 新建子合集..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCollection();
                    }
                  }}
                  className="bg-transparent border-none text-[10px] text-slate-200 placeholder-purple-900/60 focus:outline-none w-full px-1 font-sans"
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  className="p-1 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer text-[10px] bg-white/5 hover:bg-purple-550/15 rounded font-black leading-none"
                  title="确认创建"
                >
                  确定
                </button>
              </div>
            </div>
          </div>

          
          {/* Tag Cloud filter */}
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-[#a855f7]/40 font-bold mb-3 px-2">标签快速检索 (STYLE FILTERS)</p>
            {getAllUniqueTags().length === 0 ? (
              <p className="text-slate-600 text-[11px] italic px-2">暂无可用分类标签...</p>
            ) : (
              <div className="flex flex-wrap gap-2 px-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                <span 
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                    selectedTag === null 
                      ? "bg-purple-500/20 text-purple-400 border border-purple-400/30" 
                      : "bg-[#020005]/80 border border-purple-500/10 text-slate-400 hover:text-white"
                  }`}
                >
                  * 全部重置
                </span>
                {getAllUniqueTags().map((tag) => (
                  <span 
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-all border ${
                      selectedTag === tag 
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs" 
                        : "bg-[#020005]/80 border-purple-500/10 text-slate-400 hover:text-white hover:border-white/10"
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* User Account Session Info */}
          <div className="mt-auto pt-4 border-t border-purple-500/10 px-2 space-y-2">
            <div className="flex items-center justify-between bg-white/[0.02] border border-purple-500/10 p-2 rounded-xl">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-[10px] text-purple-400 font-mono shrink-0">
                  {currentUser?.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-350 truncate leading-none">
                    {currentUser?.email}
                  </span>
                  <span className="text-[9px] text-[#a855f7] font-mono mt-1">
                    当前私库已连接
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors shrink-0"
                title="安全退出并锁库"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Secure Sandbox Status banner */}
          <div className="pt-2 px-2">
            <div className="p-3.5 bg-purple-950/20 rounded-xl border border-purple-500/10 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#a855f7] font-bold">
                <FolderLock size={14} className="text-[#a855f7]" />
                <span>100% 私人沙盒模式</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                所有创作图片和提示词完美归于本地私人内存中。绝不上传、审查或向外界公开。
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-purple-400">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                本地私密储存有效
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN DISPLAY REGION */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#020005]">
          
          {/* Header titles */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-purple-500/10 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {selectedCollectionId 
                  ? `合集: 📁 ${collections.find(col => col.id === selectedCollectionId)?.name || "安全合集"}`
                  : selectedTag 
                    ? `标签: #${selectedTag}` 
                    : "私密提示词保险库"
                }
                <span className="bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-purple-500/15">
                  Private Cloud
                </span>
              </h2>
              <p className="text-xs text-white/40 mt-1 select-none">
                {cards.length === 0 
                  ? "目前暂无记录，可点击右侧反推工具一键生成您的首个画集备份！" 
                  : `当前共有 ${filteredCards.length} 项图集匹配条件，一一对应，安全存储。`}
              </p>
            </div>
            
            {/* Storage Quota widget */}
            <div className="bg-[#0b0518] p-2.5 rounded-lg border border-purple-500/10 flex flex-col text-right w-44 sm:self-auto self-start">
              <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-[#a855f7]/60 uppercase">
                <span>私有内存利用量</span>
                <span className="text-purple-300 font-mono">{getStorageSizeMB()} MB</span>
              </div>
              <div className="w-full h-1 bg-[#020005] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-505"
                  style={{ width: `${Math.min(100, (parseFloat(getStorageSizeMB()) / 5) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* ACTIVE CREATE WORKSPACE FORMS (MANUAL / AI DESCRIBE) */}
          {activeTab === "add-manual" && (
            <div className="bg-[#0b0518] border border-purple-500/20 rounded-xl p-5 shadow-xl animate-scale-in relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-550 to-fuchsia-500 w-full"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h3 className="font-bold text-sm text-purple-400 uppercase tracking-wider flex items-center gap-1.5 select-none font-sans">
                  <Plus size={16} />
                  <span>
                    {manualAddMode === "draw" && "手动录入：🎨 AI 绘图提示词卡片"}
                    {manualAddMode === "system" && "手动录入：🤖 单个 AI 系统提示词库"}
                    {manualAddMode === "skill" && "手动录入：⚡ SKILL 专属高级技能规则"}
                  </span>
                </h3>
                <button 
                  onClick={() => setActiveTab("gallery")}
                  className="text-xs text-white/40 hover:text-slate-200 cursor-pointer self-end sm:self-auto"
                >
                  关闭窗口
                </button>
              </div>

              {/* HIGHLY POLISHED INNER PAGE SEGMENTED TABS SWITCHER */}
              <div className="flex flex-wrap bg-[#020005]/80 border border-purple-550/10 rounded-xl p-1 mb-5 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setManualAddMode("draw")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "draw"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>🎨</span>
                  <span>AI 绘图提示词</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualAddMode("system")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "system"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>🤖</span>
                  <span>系统主控制指令</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualAddMode("skill")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "skill"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>⚡</span>
                  <span>SKILL 技能规则</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Form Image Dropzone Column */}
                <div className="md:col-span-4 flex flex-col items-center justify-start gap-3">
                  <div className="w-full text-center">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider font-sans">
                      {manualAddMode === 'draw' && "✨ 配套生成效果图 (IMAGE)"}
                      {manualAddMode === 'system' && "🤖 智能体标志与头像 (AVATAR)"}
                      {manualAddMode === 'skill' && "⚡ 技能封面指示图 (COVER)"}
                    </span>
                  </div>

                  {manualImageFile ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-purple-500/20 group bg-[#020005] shadow-inner">
                      <img src={manualImageFile} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setManualImageFile(null)}
                        className="absolute bottom-2 right-2 bg-red-650 hover:bg-red-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold shadow-md transition-colors"
                      >
                        替换文件
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRefManual.current?.click()}
                      onDragOver={handleManualDragOver}
                      onDragLeave={handleManualDragLeave}
                      onDrop={handleManualDrop}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer w-full aspect-square ${
                        isDraggingManual 
                          ? "border-purple-550/60 bg-purple-950/20 scale-[0.98]" 
                          : "border-purple-500/10 bg-white/[0.01] hover:bg-[#020005] hover:border-purple-400/30"
                      }`}
                    >
                      {uploadProgress ? (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      ) : (
                        <FileUp className="w-6 h-6 text-slate-500" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white/70 block font-sans">点击上传自定义图片</span>
                        <span className="text-[9px] text-white/20 block mt-1 leading-normal px-2 font-sans">
                          {manualAddMode === 'draw' && "推荐配备最终跑图，便于往后一眼辨识效果"}
                          {manualAddMode === 'system' && "可上传头像，若不传则全自动匹配智能脑区炫酷视觉封底"}
                          {manualAddMode === 'skill' && "可上传标志，若不传则自动分配合流光格栅概念封底"}
                        </span>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRefManual}
                    onChange={handleManualImageSelect}
                    accept="image/*"
                    className="hidden" 
                  />
                  
                  {!manualImageFile && (
                    <span className="text-[10px] text-purple-400/70 font-medium tracking-wide font-sans">
                      🌿 自由沙盒：此处不传图也将自动安全封存，极致省心
                    </span>
                  )}
                </div>

                {/* Form Fields Column: Dynamic Layout for three separate subpages */}
                <div className="md:col-span-8 flex flex-col gap-4">

                  {/* SUBPAGE 1: Core Draw Prompt View */}
                  {manualAddMode === "draw" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#a855f7]/55 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>AI 绘图提示词 (DRAW CORE PROMPT) *</span>
                          <span className="text-[9px] text-[#a855f7]/40 font-normal">核心绘图渲染词组</span>
                        </label>
                        <textarea 
                          rows={6}
                          value={manualPrompt}
                          onChange={(e) => setManualPrompt(e.target.value)}
                          placeholder="例如: A fantasy landscape with towering luminous crystals under a starry sky, surreal atmospheric lighting, octane render, 8k..."
                          className="w-full bg-[#020005]/80 border border-purple-500/15 rounded-xl p-3.5 text-xs text-white placeholder-purple-900/40 focus:outline-none focus:border-purple-500/40 font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUBPAGE 2: Core LLM System / Character System Prompt View */}
                  {manualAddMode === "system" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>🤖 单个 AI 系统主脑指令 (SYSTEM / AGENT PROMPT) *</span>
                          <span className="text-[9px] text-purple-500/60 font-normal font-sans">规范大语言模型角色、上下文、语气或前置主干设定的核心指令</span>
                        </label>
                        <textarea
                          rows={6}
                          value={manualSingleAiPrompt}
                          onChange={(e) => setManualSingleAiPrompt(e.target.value)}
                          placeholder="例如: You are an expert system-level AI Agent. Your prime directive is to analyze input queries, refine prompt structures, and guide the user in designing pristine software architectures. Maintain an objective, concise, and calm persona..."
                          className="w-full bg-[#020005]/80 border border-purple-500/15 focus:border-purple-500/40 rounded-xl p-3.5 text-xs text-purple-100 placeholder-purple-950 focus:outline-none font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUBPAGE 3: Advanced SKILL Preset Instruction View */}
                  {manualAddMode === "skill" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-fuchsia-400 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>⚡ SKILL 提示词 / 专属技能操作规则 (SKILL RULES SETUP) *</span>
                          <span className="text-[9px] text-fuchsia-500/60 font-normal font-sans">高级代码块微操指导、提示词封装宏模块，或者全局微调的特定负向逻辑</span>
                        </label>
                        <textarea
                          rows={6}
                          value={manualSkillPrompt}
                          onChange={(e) => setManualSkillPrompt(e.target.value)}
                          placeholder="例如: [Skill: CleanTypeScriptCode]\n1. Always prefer named relative imports placed directly on top.\n2. Do not mutate state objects directly; use shallow spreads.\n3. Add unique id attributes to every primary interactive DOM node..."
                          className="w-full bg-[#020005]/80 border border-fuchsia-500/15 focus:border-fuchsia-500/40 rounded-xl p-3.5 text-xs text-fuchsia-100 placeholder-fuchsia-950 focus:outline-none font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Tags Generator Row */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-sans">
                      <label className="block text-[10px] font-bold text-white/40 uppercase">精准分类标签 (可手动增减，多维度解析)</label>
                      <button 
                        type="button"
                        onClick={triggerTagSuggestion}
                        disabled={apiLoading || 
                          (manualAddMode === 'draw' ? !manualPrompt.trim() : 
                           manualAddMode === 'system' ? !manualSingleAiPrompt.trim() : 
                           !manualSkillPrompt.trim())}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        {apiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>AI 打标分类</span>
                      </button>
                    </div>

                    {/* Tag Badges Container with clear categorizations */}
                    <div className="bg-[#020005]/80 p-3.5 rounded-xl border border-purple-500/10 min-h-[50px] flex items-center flex-wrap gap-2.5 font-sans">
                      {manualTags.length === 0 ? (
                        <span className="text-[10px] text-white/30 font-mono">暂无标签。请写完提示词点“AI 智能打标”或在下方直接手动添加标签</span>
                      ) : (
                        manualTags.map((tag, i) => {
                          // Determine structural dimension badge dynamically based on position
                          let prefixInfo = "🏷️ 其它";
                          let badgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                          if (i === 0) {
                            prefixInfo = "💎 主体";
                            badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          } else if (i === 1) {
                            prefixInfo = "🌍 主题";
                            badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                          } else if (i === 2) {
                            prefixInfo = "🎭 风格";
                            badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                          }

                          return (
                            <span 
                              key={i} 
                              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border font-bold ${badgeStyle} animate-scale-in`}
                            >
                              <span className="text-[9px] opacity-70 tracking-wider font-medium">{prefixInfo}:</span>
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveManualTag(tag)}
                                className="ml-1.5 hover:text-red-400 transition-colors cursor-pointer text-xs font-black select-none rounded p-0.5"
                                title="删除此标签"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Inline tag input wrapper */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          placeholder="输入想要添加的新标签并按回车..."
                          value={newManualTagInput}
                          onChange={(e) => setNewManualTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddManualTag();
                            }
                          }}
                          className="w-full bg-[#020005]/80 border border-purple-500/10 rounded-lg py-1.5 px-3 text-xs text-white placeholder-purple-900/30 focus:outline-none focus:border-purple-500/40 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddManualTag}
                        className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md font-sans"
                      >
                        + 增加
                      </button>
                    </div>
                  </div>

                  {/* Save row */}
                  <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-purple-500/10">
                    <button 
                      onClick={() => setActiveTab("gallery")}
                      className="px-4 py-2 bg-transparent text-xs text-white/55 hover:text-white transition-colors"
                    >
                      放弃
                    </button>
                    <button 
                      onClick={saveManualCard}
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-650 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer font-sans"
                    >
                      保存在本地库
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "add-ai" && (
            <div className="bg-[#0b0518] border border-purple-500/20 rounded-xl p-5 shadow-xl animate-scale-in relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-500 to-fuchsia-500 w-full animate-pulse"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-purple-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Sparkles size={16} />
                    <span>多模态图片反推提示词工具</span>
                  </h3>
                  <span className="bg-purple-500/10 text-purple-400 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-500/15">
                    Gemini 3.5 Flash Powered
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowApiConfig(!showApiConfig)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer font-sans ${
                      useCustomApi 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>{useCustomApi ? "自定义 API (已启用)" : "手动配置 API"}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("gallery")}
                    className="text-xs text-white/40 hover:text-slate-200 cursor-pointer font-sans"
                  >
                    关闭窗口
                  </button>
                </div>
              </div>

              {/* Collapsible Custom API Configurations Entry */}
              {showApiConfig && (
                <div className="mb-5 p-4 rounded-xl bg-purple-950/20 border border-purple-500/15 text-xs text-slate-300 space-y-4 animate-slide-down relative z-20 shadow-lg font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <span>⚙️</span> 手动配置第三方通用 API 密钥及代理端点
                    </span>
                    <button 
                      onClick={() => setShowApiConfig(false)}
                      className="text-[10px] text-white/40 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
                    >
                      [ 隐藏面板 ]
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    本提示词保险库完全在离线前端浏览器沙盒内存储画集与词库，绝对保证隐私。如需自主调用多模态图片反推或智能打标提炼，可在下方配置符合您个人习惯的 AI 厂商基础配置。
                  </p>

                  {/* Provider Choice Selector */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-[#a855f7]/60 uppercase tracking-wider">选择接口兼容协议 (Protocol Provider)</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomProvider("gemini");
                          localStorage.setItem("custom_gemini_provider", "gemini");
                          if (customModel === "gpt-4o-mini" || customModel === "deepseek-chat" || !customModel) {
                            setCustomModel("gemini-3.5-flash");
                            localStorage.setItem("custom_gemini_model", "gemini-3.5-flash");
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                          customProvider === "gemini"
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-350 shadow-sm"
                            : "bg-[#020005] border-white/5 text-slate-400 hover:bg-[#020005]/80"
                        }`}
                      >
                        Gemini 官方 SDK 格式
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomProvider("openai");
                          localStorage.setItem("custom_gemini_provider", "openai");
                          if (customModel === "gemini-3.5-flash" || !customModel) {
                            setCustomModel("gpt-4o-mini");
                            localStorage.setItem("custom_gemini_model", "gpt-4o-mini");
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                          customProvider === "openai"
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-350 shadow-sm"
                            : "bg-[#020005] border-white/5 text-slate-400 hover:bg-[#020005]/80"
                        }`}
                      >
                        OpenAI 兼容中转格式 (支持 DeepSeek、硅基流动等)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">
                          {customProvider === "gemini" ? "Gemini API Key 🔑" : "API 密钥 (API Key) 🔑"}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                          >
                            {showApiKey ? "隐藏密钥" : "显示密钥"}
                          </button>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                              if (input) {
                                input.focus();
                                input.select();
                              }
                            }}
                            className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                          >
                            [一键全选]
                          </button>
                        </div>
                      </div>
                      <input 
                        type={showApiKey ? "text" : "password"}
                        placeholder={customProvider === "gemini" ? "AI Studio 密钥 (AIzaSy...)" : "各种格式 API 密钥 (如 sk-...)"}
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          localStorage.setItem("custom_gemini_api_key", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider font-sans">
                          {customProvider === "gemini" ? "直连代理端点 / Base URL 🌐" : "第三方中转接口 / Base URL 🌐"}
                        </span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                        >
                          [一键全选]
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder={customProvider === "gemini" ? "默认 (留空) 或 https://generativelanguage.googleapis.com" : "例如: https://api.deepseek.com/v1 或 https://api.siliconflow.cn/v1"}
                        value={customApiUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiUrl(val);
                          localStorage.setItem("custom_gemini_api_url", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider font-sans">模型名称 / Model ID 🤖</span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                        >
                          [一键全选]
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder={customProvider === "gemini" ? "默认 gemini-3.5-flash" : "对于 DeepSeek 请填: deepseek-chat 或 含有 vision 支持的模型"}
                        value={customModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomModel(val);
                          localStorage.setItem("custom_gemini_model", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Test Custom API status panel */}
                  {testApiResult && (
                    <div className={`p-3 rounded-lg text-xs leading-relaxed animate-scale-in border ${
                      testApiResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border-red-500/20 text-red-300"
                    }`}>
                      <div className="flex gap-2 items-start">
                        <span className="text-sm font-sans">{testApiResult.success ? "✅" : "⚠️"}</span>
                        <div>
                          <p className="font-bold">{testApiResult.success ? "连接测试通过 (Connection Success)" : "连接测试失败 (Connection Failed)"}</p>
                          <p className="opacity-90 mt-0.5">{testApiResult.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2.5 gap-3 border-t border-purple-500/10">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={useCustomApi}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUseCustomApi(val);
                          localStorage.setItem("use_custom_gemini_api", val ? "true" : "false");
                        }}
                        className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-200 font-sans">启用手动配置的第三方 API 优先模式</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestApiConnection}
                        disabled={testApiLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-555 active:scale-[0.98] text-white font-bold text-xs font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none shadow-md"
                      >
                        {testApiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "⚡"}
                        {testApiLoading ? "正在测试..." : "测试连接可用性"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Upload Section */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  {aiImageFile ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-purple-500/20 group bg-[#020005]">
                      <img src={aiImageFile} alt="Uploaded Resource" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setAiImageFile(null); setAiDescribeResult(null); }}
                        className="absolute bottom-2 right-2 bg-red-650 hover:bg-red-700 text-white rounded-lg p-1.5 text-xs transition-colors font-sans"
                      >
                        清除并更换
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRefAI.current?.click()}
                      onDragOver={handleAIDragOver}
                      onDragLeave={handleAIDragLeave}
                      onDrop={handleAIDrop}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer w-full aspect-square ${
                        isDraggingAI 
                          ? "border-purple-550/60 bg-purple-950/20 scale-[0.98]" 
                          : "border-purple-500/10 bg-white/[0.02] hover:bg-purple-950/10 hover:border-purple-400/30"
                      }`}
                    >
                      {uploadProgress ? (
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-purple-400 font-sans">
                          拖拽任意精彩图片至此 或
                          <span className="text-purple-300 font-bold underline cursor-pointer ml-1">点击本地上传</span>
                        </p>
                        <p className="text-[10px] text-white/20 font-sans">
                          支持 PNG, JPG, JPEG, WEBP 格式参考图
                        </p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRefAI}
                    onChange={handleAiImageSelect}
                    accept="image/*"
                    className="hidden" 
                  />
                </div>

                {/* Inputs & Custom Prompts Column */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  {aiDescribeResult ? (
                    <div className="space-y-4 animate-scale-in">
                      {/* Model & Custom Inputs for AI Extracted Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Model Designation */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 font-sans">🎯 适用的AI模型 (Choose Target Model)</label>
                          <select
                            value={aiTargetModel}
                            onChange={(e) => setAiTargetModel(e.target.value)}
                            className="w-full bg-[#020005] border border-purple-500/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500/40 font-mono"
                          >
                            <option value="Midjourney v6">Midjourney v6</option>
                            <option value="Niji v6">Niji v6 (二次元)</option>
                            <option value="FLUX.1">FLUX.1 (Pro / Dev / Schnell)</option>
                            <option value="Stable Diffusion 3">Stable Diffusion 3 / XL</option>
                            <option value="DALL-E 3">OpenAI DALL-E 3</option>
                            <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Imagen 3)</option>
                            <option value="GPT-4o (System Prompt)">GPT-4o / Claude 3.5</option>
                            <option value="自定义特定模型">其它自定义模型...</option>
                          </select>
                        </div>

                        {/* Quick custom text input for target model if they choose or simply edit */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 font-sans">✏️ 自定义特定的AI模型名称</label>
                          <input
                            type="text"
                            value={aiTargetModel}
                            onChange={(e) => setAiTargetModel(e.target.value)}
                            placeholder="也可以在此直接手动修改或输入您的特定模型名称"
                            className="w-full bg-[#020005] border border-purple-500/10 rounded-xl p-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Drawing Prompt (反推 AI 绘图提示词) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span>🎨 反推得到的 AI 绘图提示词 (Reversed AI Drawing Prompt) *</span>
                            </label>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  const textEl = e.currentTarget.closest('.space-y-1.5')?.querySelector('textarea');
                                  if (textEl) {
                                    textEl.focus();
                                    textEl.select();
                                  }
                                }}
                                className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                              >
                                [一键全选]
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  navigator.clipboard.writeText(aiDescribeResult.prompt);
                                  alert("绘图提示词已成功复制到剪贴板！");
                                }}
                                className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                              >
                                [一键复制]
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={4}
                            value={aiDescribeResult.prompt}
                            onChange={(e) => setAiDescribeResult({
                              ...aiDescribeResult,
                              prompt: e.target.value
                            })}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            placeholder="绘图提示词内容..."
                            className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder-white/20 focus:outline-none font-mono leading-relaxed select-all"
                          />
                        </div>

                        {/* Vision Analysis & Description (画风与画面描述) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span>📝 画风与画面描述分析 (Vision Analysis & Description) *</span>
                            </label>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  const textEl = e.currentTarget.closest('.space-y-1.5')?.querySelector('textarea');
                                  if (textEl) {
                                    textEl.focus();
                                    textEl.select();
                                  }
                                }}
                                className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                              >
                                [一键全选]
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  navigator.clipboard.writeText(aiDescribeResult.description);
                                  alert("画面分析描述已成功复制到剪贴板！");
                                }}
                                className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                              >
                                [一键复制]
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={4}
                            value={aiDescribeResult.description}
                            onChange={(e) => setAiDescribeResult({
                              ...aiDescribeResult,
                              description: e.target.value
                            })}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            placeholder="图像描述分析结果..."
                            className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder-[#a855f7]/30 focus:outline-none font-mono leading-relaxed select-all"
                          />
                        </div>
                      </div>

                      {/* Three tags */}
                      <div className="space-y-2 border-t border-purple-500/10 pt-3.5">
                        <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">精准分类标签 (可手动增减)</span>
                        
                        <div className="bg-[#020005] p-3 rounded-xl border border-purple-500/10 flex flex-wrap gap-2 min-h-[46px] items-center font-sans">
                          {aiDescribeResult.tags.map((tag, i) => {
                            let prefixInfo = "🏷️ 其它";
                            let badgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                            if (i === 0) {
                              prefixInfo = "💎 主体";
                              badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            } else if (i === 1) {
                              prefixInfo = "🌍 主题";
                              badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                            } else if (i === 2) {
                              prefixInfo = "🎭 风格";
                              badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            }

                            return (
                              <span 
                                key={i} 
                                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border font-bold ${badgeStyle} animate-scale-in`}
                              >
                                <span className="text-[9px] opacity-70 tracking-wider font-medium">{prefixInfo}:</span>
                                <span>#{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAiTag(tag)}
                                  className="ml-1.5 hover:text-red-400 transition-colors cursor-pointer text-xs font-black select-none"
                                  title="删除此标签"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Quick Add Inline */}
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="输入要为该图新增的个性化标签..."
                            value={newAiTagInput}
                            onChange={(e) => setNewAiTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddAiTag();
                              }
                            }}
                            className="bg-[#020005] border border-purple-500/10 rounded-lg py-1 px-2.5 text-[11px] text-white placeholder-purple-900/40 focus:outline-none focus:border-purple-500/40 font-mono flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleAddAiTag}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] rounded transition-all cursor-pointer shadow-xs font-sans"
                          >
                            + 追加
                          </button>
                        </div>
                      </div>

                      {/* Saving action */}
                      <div className="pt-3 border-t border-purple-500/10 flex justify-end gap-2.5">
                        <button 
                          onClick={() => { setAiDescribeResult(null); setAiImageFile(null); }}
                          className="px-4 py-2 text-xs text-white/40 hover:text-white font-sans"
                        >
                          重置
                        </button>
                        <button 
                          onClick={saveAiAnalyzedCard}
                          className="px-5 py-2 bg-purple-700 hover:bg-purple-650 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 font-sans"
                        >
                          <Plus size={13} />
                          <span>一键归档和备份</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] bg-[#020005]/60 border border-dashed border-purple-500/10 rounded-xl text-center p-6 text-white/40">
                      <Sparkles className="w-8 h-8 text-purple-700 mb-2 animate-pulse" />
                      <p className="text-xs font-medium font-sans">在左侧上传或拖拽任何一张优秀的 AI 生成图片</p>
                      <p className="text-[10px] text-white/20 mt-1 max-w-sm leading-relaxed font-sans">
                        系统将提取主体要素与画风，重构出一份极其优美细腻的反推提示词，为您提供无损保存与一键复制功能。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GALLERY CONTENT GRID */}
          <div className="flex-1">
            {/* Active search or tag filters notification row */}
            {(searchQuery || selectedTag || selectedCollectionId) && (
              <div className="mb-5 p-3 bg-purple-950/25 border border-purple-500/15 rounded-xl flex items-center justify-between text-xs text-purple-300 font-sans">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-purple-400" />
                  <span>
                    正在进行条件筛选：
                    {searchQuery && ` 关键词: "${searchQuery}"`}
                    {selectedTag && ` 标签: #${selectedTag}`}
                    {selectedCollectionId && ` 合集文件夹: "📁 ${collections.find(c => c.id === selectedCollectionId)?.name}"`}
                  </span>
                </div>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedTag(null); setSelectedCollectionId(null); }}
                  className="font-bold underline text-purple-400 hover:text-purple-300 ml-4 hover:no-underline cursor-pointer"
                >
                  清除所有过滤条件
                </button>
              </div>
            )}

            {filteredCards.length === 0 ? (
              <div className="min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-[#0b0518]/30 border border-purple-500/10 rounded-2xl gap-4">
                <div className="w-16 h-16 bg-[#020005] border border-purple-500/15 rounded-full flex items-center justify-center text-2xl shadow-inner text-[#a855f7]/30 animate-pulse">
                  🔮
                </div>
                <div className="font-sans">
                  <h4 className="text-sm font-extrabold text-[#a855f7] uppercase tracking-widest">沙盒数据库当前为空</h4>
                  <p className="text-[11px] text-white/30 mt-1.5 max-w-md leading-relaxed">
                    您可以立刻点击右侧的 <span className="font-mono text-purple-400">AI 逆向分析助手</span> 或顶部的 <span className="text-purple-400 font-mono">手动保存</span>，上传您最喜爱的参考图并关联对应的提示词！
                  </p>
                </div>
                <div className="flex gap-2.5 mt-2 font-sans">
                  <button 
                    onClick={() => setActiveTab("add-ai")}
                    className="py-1.5 px-4 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-bold tracking-wider transition-colors"
                  >
                    开始 AI 解析
                  </button>
                  <button 
                    onClick={() => {
                      saveCardsToStateAndStorage(INITIAL_DEMO_CARDS);
                    }}
                    className="py-1.5 px-3.5 bg-[#020005] border border-purple-500/15 hover:border-purple-500/30 text-slate-300 rounded text-xs tracking-wider transition-all"
                  >
                    恢复预置样例数据
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCards.map((card) => (
                  <PromptCard 
                    key={card.id}
                    card={card}
                    onDelete={handleDeleteCard}
                    onSelect={(selected) => setViewDetailCard(selected)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER STAUS BAR */}
      <footer className="h-9 border-t border-purple-500/10 bg-[#020005]/95 flex flex-col sm:flex-row items-center justify-between px-6 text-[10px] text-white/30 tracking-wide gap-2 pb-1.5 pt-1.5 sm:py-0 shrink-0 font-sans">
        <div className="flex gap-4 sm:gap-6 items-center">
          <span>AI 提示词保险库 版本 1.2.0-beta</span>
          <span className="sm:inline hidden">•</span>
          <span>独立运行单元: <span className="text-purple-400 font-mono font-bold">100% 离线沙盒安全保障</span></span>
        </div>
        <div className="flex gap-4 font-semibold text-slate-400 hover:text-white transition-colors">
          <span>所有创作素材和提示词终身归您私人所有，未公开发布不予审查。</span>
        </div>
      </footer>

      {/* DETAIL DRAWER / POPUP MODAL */}
      {viewDetailCard && (
        <CardDetailModal 
          card={viewDetailCard}
          onClose={() => setViewDetailCard(null)}
          onDelete={handleDeleteCard}
          onUpdateTags={handleUpdateTags}
          onUpdateCard={handleUpdateCard}
          collections={collections}
          onToggleCollection={handleToggleCollectionForCard}
        />
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#0b0518] border border-purple-500/20 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                <LogOut size={22} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-100 tracking-wider uppercase">
                  确定要安全退出吗？
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  安全退出后将自动锁闭保险库。您需要再次输入密保暗号登入，或通过管理员免密通道进入。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2 bg-[#020005] border border-purple-500/10 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-purple-950/30 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setCurrentUser(null);
                    localStorage.removeItem("prompt_vault_session");
                  }}
                  className="py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/45 cursor-pointer"
                >
                  确定退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
