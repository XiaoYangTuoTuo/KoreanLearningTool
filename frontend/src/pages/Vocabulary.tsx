import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RefreshCw, Volume2, Star, Check, X, ChevronRight, ChevronLeft, Filter, LayoutGrid, List } from 'lucide-react';
import { vocabularyData, VocabularyWord, VocabularyCategory } from '../data/vocabularyData';
import clsx from 'clsx';
import { cn } from '../lib/utils';

const Vocabulary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    if (currentIndex >= currentCards.length - 1) {
      // End of session logic could go here
      return;
    }

    setDirection(1);
    setSessionStats(prev => ({
      ...prev,
      learned: known ? prev.learned + 1 : prev.learned,
      review: !known ? prev.review + 1 : prev.review
    }));
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setDirection(0);
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
      rotateY: direction > 0 ? -45 : 45
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
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? -45 : 45,
      transition: {
        duration: 0.4
      }
    })
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar: Categories */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col overflow-hidden flex-shrink-0">
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
      <div className="flex-1 flex flex-col relative bg-gray-50/50 rounded-xl border border-dashed border-gray-200 overflow-hidden">
        
        {/* Header Bar - Sticky */}
        <div className="flex justify-between items-center px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10 sticky top-0">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 font-serif">
                {selectedCategory === 'all' ? '所有单词' : vocabularyData.find(c => c.id === selectedCategory)?.name}
             </h1>
             <p className="text-gray-400 text-xs mt-1">
               {viewMode === 'card' ? (
                 <>进度: {currentIndex + 1} / {currentCards.length}</>
               ) : (
                 <>总数: {currentCards.length} 条（去重后）</>
               )}
             </p>
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
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-lg h-96 perspective-1000">
              <AnimatePresence initial={false} custom={direction}>
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full cursor-pointer preserve-3d"
                    onClick={handleFlip}
                    style={{ transformStyle: 'preserve-3d' }}
                    transition={{ duration: 0.6 }}
                  >
                    {/* Front */}
                    <motion.div
                      className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-amber-100 flex flex-col items-center justify-center backface-hidden p-8 text-center hover:shadow-2xl transition-shadow"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-8">
                        {currentCard.level}
                      </span>
                      <h2 className="text-5xl font-bold text-gray-900 font-serif mb-4">
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
                      className="absolute inset-0 w-full h-full bg-amber-900 rounded-2xl shadow-xl flex flex-col items-center justify-center backface-hidden p-8 text-center text-white"
                      initial={{ rotateY: 180 }}
                      animate={{ rotateY: isFlipped ? 0 : -180 }}
                      transition={{ duration: 0.6 }}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <h3 className="text-3xl font-bold mb-2">{currentCard.cn}</h3>
                      <p className="text-amber-200/80 mb-6 font-serif italic">{currentCard.en}</p>
                      
                      {currentCard.example && (
                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm w-full">
                          <p className="text-lg font-medium mb-1">{currentCard.example.kr}</p>
                          <p className="text-sm text-gray-300">{currentCard.example.cn}</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State */}
              {!currentCard && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <RefreshCw className="w-12 h-12 mb-4" />
                  <p>加载中...</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-12 flex gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm font-medium group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                有点模糊
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium group"
              >
                <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                记住了
              </button>
            </div>
          </div>
        ) : (
          // --- List View ---
          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
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
              
              {currentCards.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  没有找到单词
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vocabulary;
