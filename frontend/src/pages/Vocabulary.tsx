import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RefreshCw, Volume2, Star, Check, X, ChevronRight, ChevronLeft, Filter, LayoutGrid, List, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { vocabularyData, VocabularyWord, VocabularyCategory } from '../data/vocabularyData';
import clsx from 'clsx';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/useIsMobile';

const Vocabulary: React.FC = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For collapsible menu
  const [currentCards, setCurrentCards] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ learned: 0, review: 0 });
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [importedWords, setImportedWords] = useState<Array<VocabularyWord & { category: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  const MIN_WORDS_PER_CATEGORY = 0;

  const mergeBaseAndImported = (categoryId: string): VocabularyWord[] => {
    const base: VocabularyWord[] = [];
    if (categoryId === 'all') {
      vocabularyData.forEach(cat => base.push(...cat.words));
    } else {
      const category = vocabularyData.find(c => c.id === categoryId);
      if (category) base.push(...category.words);
    }
    const extra = importedWords
      .filter(w => categoryId === 'all' ? true : w.category === categoryId)
      .map((w, idx) => ({
        id: w.id || `imp_${Date.now()}_${idx}`,
        kr: w.kr,
        cn: w.cn,
        en: w.en,
        pronunciation: w.pronunciation || '-',
        level: w.level || 'Beginner',
        example: w.example
      }));
    // Deduplicate by normalized Korean word (kr) within category
    const seen = new Set<string>();
    const unique: VocabularyWord[] = [];
    [...base, ...extra].forEach(w => {
      const key = (w.kr || '').trim().toLowerCase();
      if (!key) return;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(w);
      }
    });
    return unique;
  };

  const handleImportFile = async (file: File) => {
    try {
      setIsImporting(true);
      const text = await file.text();
      let rows: Array<any> = [];
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        rows = Array.isArray(data) ? data : (data.words || []);
      } else {
        // naive CSV parser: id,kr,cn,en,pronunciation,level,category,exampleKr,exampleCn
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const header = lines[0].split(',').map(s => s.trim());
        const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
        rows = lines.slice(1).map(line => {
          const cols = line.split(',');
          return {
            id: cols[idx('id')] || '',
            kr: cols[idx('kr')] || '',
            cn: cols[idx('cn')] || '',
            en: cols[idx('en')] || '',
            pronunciation: cols[idx('pronunciation')] || '-',
            level: (cols[idx('level')] as any) || 'Beginner',
            category: cols[idx('category')] || 'daily',
            example: (cols[idx('exampleKr')] || cols[idx('exampleCn')]) ? {
              kr: cols[idx('exampleKr')] || '',
              cn: cols[idx('exampleCn')] || ''
            } : undefined
          };
        });
      }
      const normalized = rows
        .filter(r => r && r.kr && r.cn)
        .map((r: any, i: number) => ({
          id: r.id || `imp_${Date.now()}_${i}`,
          kr: r.kr,
          cn: r.cn,
          en: r.en || '',
          pronunciation: r.pronunciation || '-',
          level: (r.level as any) || 'Beginner',
          example: r.example,
          category: r.category || 'daily'
        }));
      setImportedWords(prev => [...prev, ...normalized]);
    } catch (e) {
      console.error('导入词库失败', e);
    } finally {
      setIsImporting(false);
    }
  };

  // Auto-load built-in TOPIK pack from public folder if present
  useEffect(() => {
    const loadPack = async () => {
      try {
        const res = await fetch('/vocab/topik_pack.json');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data
            .filter((r: any) => r && r.kr && r.cn)
            .map((r: any, i: number) => ({
              id: r.id || `pack_${Date.now()}_${i}`,
              kr: r.kr,
              cn: r.cn,
              en: r.en || '',
              pronunciation: r.pronunciation || '-',
              level: (r.level as any) || 'Beginner',
              example: r.example,
              category: r.category || 'daily'
            }));
          setImportedWords(prev => [...prev, ...normalized]);
        }
      } catch (_) {
        // silent
      }
    };
    loadPack();
  }, []);

  // Initialize cards (with imported words merged)
  useEffect(() => {
    let cards: VocabularyWord[] = mergeBaseAndImported(selectedCategory);
    
    // Only shuffle for card mode to keep list mode organized (optional, but better UX usually)
    // Actually, keeping the random order for "All" in list mode might be confusing, but let's stick to the current logic for consistency first.
    // However, for a "Vocabulary Book" feel, sorted might be better. Let's sort by ID or just keep original order for list view if specific category is selected.
    
    if (viewMode === 'card') {
       setCurrentCards(cards.sort(() => Math.random() - 0.5));
    } else {
       // For list view, maybe keep them in order? Or just use the same list. 
       // If "All" is selected, random is chaos in a list. Let's just use the cards as is.
       // Actually, let's just reset the cards list based on selection.
       setCurrentCards(cards);
    }
    
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ learned: 0, review: 0 });
  }, [selectedCategory, viewMode]);

  const handleNext = (known: boolean) => {
    if (currentIndex >= currentCards.length) {
      return;
    }

    const dir = known ? 1 : -1;
    setDirection(dir);
    setSessionStats(prev => ({
      ...prev,
      learned: known ? prev.learned + 1 : prev.learned,
      review: !known ? prev.review + 1 : prev.review
    }));
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const currentCard = currentCards[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.4,
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
      transition: {
        duration: 0.4
      }
    })
  };

  if (isMobile && viewMode === 'card') {
    // Show completion state if finished
    if (currentIndex >= currentCards.length && currentCards.length > 0) {
      return (
        <div className="flex flex-col h-[calc(100vh-14rem)] items-center justify-center p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
            <Check className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">本组学习完成！</h2>
            <p className="text-gray-500">休息一下，或者挑战下一组吧。</p>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{sessionStats.learned}</p>
              <p className="text-xs text-gray-400 uppercase">记住了</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{sessionStats.review}</p>
              <p className="text-xs text-gray-400 uppercase">需复习</p>
            </div>
          </div>
          <button 
            onClick={() => { setCurrentIndex(0); setSessionStats({learned:0, review:0}); }}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
          >
            再来一遍
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[calc(100vh-14rem)] relative">
        {/* Mobile Header */}
        <div className="flex justify-between items-center p-4 bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100 rounded-t-xl">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[150px]">
              {selectedCategory === 'all' ? '全部特调' : vocabularyData.find(c => c.id === selectedCategory)?.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Mini Stats */}
             <div className="flex gap-2 text-xs font-medium">
                <span className="text-green-600 flex items-center"><Check className="w-3 h-3 mr-0.5" />{sessionStats.learned}</span>
                <span className="text-amber-600 flex items-center"><RefreshCw className="w-3 h-3 mr-0.5" />{sessionStats.review}</span>
             </div>
             <button
                onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                className="p-2 bg-gray-100 rounded-full text-gray-600"
              >
                {viewMode === 'card' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </button>
          </div>
        </div>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                style={{ height: '100vh' }} // Ensure it covers full screen
              />
              
              {/* Sidebar Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-2xl flex flex-col h-full"
              >
                <div className="p-4 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
                  <h2 className="font-bold text-amber-900 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    词汇菜单
                  </h2>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 hover:bg-amber-100 rounded-full text-amber-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                  <button
                    onClick={() => { setSelectedCategory('all'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === 'all' ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
                    )}
                  >
                    ☕ 全部特调 (随机)
                  </button>
                  {vocabularyData.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === cat.id ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                  点击类别切换单词本
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Card Area */}
        <div className="flex-1 flex flex-col items-center p-4 pb-32 overflow-y-auto relative no-scrollbar">
          {/* Progress Indicator */}
          <div className="w-full flex justify-center gap-1 mb-4">
             {currentCards.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentIndex ? "w-8 bg-amber-500" : "w-2 bg-gray-200"
                  )} 
                />
             )).slice(Math.max(0, currentIndex - 2), Math.min(currentCards.length, currentIndex + 3))}
          </div>

          <div className="relative w-full max-w-sm flex-1 perspective-1000 mb-4 flex items-center justify-center min-h-[300px]">
            <AnimatePresence initial={false} custom={direction}>
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = offset.x;
                      if (swipe < -100) {
                        handleNext(false);
                      } else if (swipe > 100) {
                        handleNext(true);
                      }
                    }}
                    className="absolute w-full h-full cursor-pointer preserve-3d"
                    onClick={handleFlip}
                    style={{ transformStyle: 'preserve-3d' }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl border border-amber-100 flex flex-col items-center backface-hidden p-6 text-center"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s'
                      }}
                    >
                      <div className="absolute top-6 right-6 text-amber-200">
                        <Star className="w-6 h-6" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full mb-4 border",
                          currentCard.level === 'Beginner' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {currentCard.level}
                        </span>
                        <h2 className="text-5xl font-bold text-gray-900 font-serif mb-4 break-all leading-tight">
                          {currentCard.kr}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                          <Volume2 className="w-4 h-4" />
                          <span className="font-mono text-sm">{currentCard.pronunciation}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 animate-pulse mt-4 mb-2">
                        点击翻转 • 左右滑动切换
                      </p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 w-full h-full bg-gray-900 rounded-3xl shadow-xl flex flex-col items-center justify-center backface-hidden p-6 text-center text-white"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                        transition: 'transform 0.6s'
                      }}
                    >
                      <h3 className="text-3xl font-bold mb-3">{currentCard.cn}</h3>
                      <p className="text-gray-400 mb-8 font-serif italic">{currentCard.en}</p>
                      
                      {currentCard.example && (
                        <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm w-full border border-white/10">
                          <p className="text-lg font-medium mb-2 leading-relaxed">{currentCard.example.kr}</p>
                          <p className="text-sm text-gray-400">{currentCard.example.cn}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions - Fixed */}
          <div className="fixed bottom-20 left-4 right-4 z-30 flex gap-4 max-w-sm mx-auto bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
             <button
                onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-md active:scale-95"
              >
                <X className="w-5 h-5" />
                <span className="text-xs font-medium">不认识</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 active:scale-95"
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-medium">记住了</span>
              </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-10rem)] h-full">
      {/* Sidebar: Categories */}
      <div className="hidden md:flex w-64 bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-amber-100 bg-amber-50/50">
          <h2 className="font-bold text-amber-900 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            词汇菜单
          </h2>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              selectedCategory === 'all' ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
            )}
          >
            ☕ 全部特调 (随机)
          </button>
          {vocabularyData.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                selectedCategory === cat.id ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {viewMode === 'card' && (
          <div className="mt-auto p-4 border-t border-amber-100 bg-amber-50/30">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>今日已学</span>
              <span className="font-bold text-green-600">{sessionStats.learned}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>待复习</span>
              <span className="font-bold text-amber-600">{sessionStats.review}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-gray-50/50 rounded-xl border border-dashed border-gray-200 overflow-hidden h-[600px] md:h-full">
        
        {/* Mobile Sidebar Drawer (Unified) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                style={{ height: '100vh' }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-2xl flex flex-col h-full"
              >
                <div className="p-4 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
                  <h2 className="font-bold text-amber-900 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    词汇菜单
                  </h2>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 hover:bg-amber-100 rounded-full text-amber-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                  <button
                    onClick={() => { setSelectedCategory('all'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === 'all' ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
                    )}
                  >
                    ☕ 全部特调 (随机)
                  </button>
                  {vocabularyData.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === cat.id ? "bg-amber-100 text-amber-900 font-medium" : "text-gray-600 hover:bg-amber-50"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                  点击类别切换单词本
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header Bar - Sticky */}
        <div className="flex justify-between items-center px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10 sticky top-0">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div>
                <h1 className="text-2xl font-bold text-gray-800 font-serif">
                   {selectedCategory === 'all' ? '所有单词' : vocabularyData.find(c => c.id === selectedCategory)?.name}
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  {viewMode === 'card' ? (
                    <>进度: {currentIndex + 1} / {currentCards.length}</>
                  ) : (
                    <>总数: {currentCards.length} 条</>
                  )}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Import */}
            <label className="px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer text-xs">
              {isImporting ? '导入中...' : '导入词库 (CSV/JSON)'}
              <input type="file" accept=".csv,.json" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }} />
            </label>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'card' ? "bg-white text-amber-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
                title="卡片模式"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'list' ? "bg-white text-amber-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
                title="列表模式"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'card' ? (
          // --- Card View ---
          <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto pb-10">
            {/* Completion State for Desktop */}
            {currentIndex >= currentCards.length && currentCards.length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
                  <Check className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">本组学习完成！</h2>
                  <p className="text-gray-500">休息一下，或者挑战下一组吧。</p>
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{sessionStats.learned}</p>
                    <p className="text-xs text-gray-400 uppercase">记住了</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-amber-600">{sessionStats.review}</p>
                    <p className="text-xs text-gray-400 uppercase">需复习</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setCurrentIndex(0); setSessionStats({learned:0, review:0}); }}
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  再来一遍
                </button>
              </div>
            ) : (
              <>
                <div className="relative w-full max-w-lg aspect-[3/2] perspective-1000 px-4">
                  <AnimatePresence initial={false} custom={direction}>
                    {currentCard && (
                      <motion.div
                        key={currentCard.id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 w-full h-full cursor-pointer preserve-3d left-0 right-0 mx-auto px-4 md:px-0"
                        onClick={handleFlip}
                        style={{ transformStyle: 'preserve-3d' }}
                        transition={{ duration: 0.6 }}
                      >
                        {/* Front */}
                        <motion.div
                          className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-amber-100 flex flex-col items-center justify-center backface-hidden p-6 md:p-8 text-center hover:shadow-2xl transition-shadow"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6 }}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-6 md:mb-6">
                            {currentCard.level}
                          </span>
                          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 font-serif mb-4 break-all">
                            {currentCard.kr}
                          </h2>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Volume2 className="w-4 h-4" />
                            <span className="font-mono text-sm">{currentCard.pronunciation}</span>
                          </div>
                          <p className="mt-8 text-xs text-gray-400 animate-pulse">
                            点击翻转查看释义
                          </p>
                        </motion.div>

                        {/* Back */}
                        <motion.div
                          className="absolute inset-0 w-full h-full bg-amber-900 rounded-2xl shadow-xl flex flex-col items-center justify-center backface-hidden p-6 md:p-8 text-center text-white"
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: isFlipped ? 0 : -180 }}
                          transition={{ duration: 0.6 }}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <h3 className="text-2xl md:text-3xl font-bold mb-2 break-all">{currentCard.cn}</h3>
                          <p className="text-amber-200/80 mb-6 font-serif italic text-sm">{currentCard.en}</p>
                          
                          {currentCard.example && (
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm w-full">
                              <p className="text-base md:text-lg font-medium mb-1">{currentCard.example.kr}</p>
                              <p className="text-xs md:text-sm text-gray-300">{currentCard.example.cn}</p>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="mt-8 md:mt-12 flex gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm font-medium group text-sm md:text-base"
                  >
                    <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    有点模糊
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium group text-sm md:text-base"
                  >
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    记住了
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // --- List View ---
          <div className="flex-1 overflow-auto p-0 md:p-8 custom-scrollbar pb-20">
            {isMobile ? (
              // Mobile List View (Cards)
              <div className="space-y-3 p-4">
                 {currentCards.map((word, idx) => (
                    <div key={word.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xl text-gray-900">{word.kr}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          word.level === 'Beginner' ? "bg-green-50 text-green-700 border-green-100" :
                          word.level === 'Intermediate' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-purple-50 text-purple-700 border-purple-100"
                        )}>
                          {word.level === 'Beginner' ? '初级' : word.level === 'Intermediate' ? '中级' : '高级'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-gray-700 font-medium">{word.cn}</p>
                            <p className="text-xs text-gray-400 font-mono">{word.pronunciation}</p>
                         </div>
                         <span className="text-xs text-gray-300">#{idx + 1}</span>
                      </div>
                    </div>
                 ))}
              </div>
            ) : (
              // Desktop List View (Table)
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4 w-16">#</th>
                      <th className="px-6 py-4">韩语 (Korean)</th>
                      <th className="px-6 py-4">中文释义</th>
                      <th className="px-6 py-4">发音 (Romaji)</th>
                      <th className="px-6 py-4 w-24">等级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentCards.map((word, idx) => (
                      <tr key={word.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold text-gray-800 text-lg font-serif">{word.kr}</td>
                        <td className="px-6 py-4 text-gray-700">{word.cn}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{word.pronunciation}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border inline-block",
                            word.level === 'Beginner' ? "bg-green-50 text-green-700 border-green-100" :
                            word.level === 'Intermediate' ? "bg-blue-50 text-blue-700 border-blue-100" :
                            "bg-purple-50 text-purple-700 border-purple-100"
                          )}>
                            {word.level === 'Beginner' ? '初级' : 
                             word.level === 'Intermediate' ? '中级' : '高级'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {currentCards.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                没有找到单词
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vocabulary;
