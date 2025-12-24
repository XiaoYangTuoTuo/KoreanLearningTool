import React, { useState, useEffect, useRef } from 'react';
import { Timer, Zap, Target, RefreshCw, Coffee, Receipt, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { sentenceData, Sentence, genres } from '../data/sentenceData';
import { useUserStore } from '../store/useStore';
import { analyzeInput, AIAnalysisResult } from '../utils/aiBarista';
import confetti from 'canvas-confetti';

type TypingState = 'ordering' | 'brewing' | 'tasting' | 'receipt';

const difficulties = [
  { id: 'sugar-100', name: '全糖 (简单)', desc: '短句，基础词汇' },
  { id: 'sugar-50', name: '半糖 (中等)', desc: '复合句，常用语法' },
  { id: 'sugar-0', name: '无糖 (困难)', desc: '长难句，高级表达' },
];

const Typing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<TypingState>('ordering');
  const [selectedMenu, setSelectedMenu] = useState<{ genre: string; difficulty: string } | null>(null);
  const [targetCount, setTargetCount] = useState(1);
  const [completedCount, setCompletedCount] = useState(0);
  const [batchResults, setBatchResults] = useState<Array<{
    accuracy: number;
    wpm: number;
    mistakes: number;
    sentence: string;
    duration: number;
  }>>([]);
  
  // Store
  const addHistory = useUserStore(state => state.addHistory);
  const addPoints = useUserStore(state => state.addPoints);
  const addMistake = useUserStore(state => state.addMistake);

  // Typing State
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, mistakes: 0 });
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize from URL params
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const difficultyParam = searchParams.get('difficulty');

    if (genreParam && difficultyParam) {
      // Validate params
      const genreExists = genres.find(g => g.id === genreParam);
      const difficultyExists = difficulties.find(d => d.id === difficultyParam);

      if (genreExists && difficultyExists) {
        setSelectedMenu({ genre: genreParam, difficulty: difficultyParam });
        // Auto-start brewing
        setState('brewing');
        
        // Pick sentence and start tasting after delay (mimicking handleOrder)
        setTimeout(() => {
          const category = sentenceData[genreParam];
          const list = category.levels[difficultyParam];
          if (list && list.length > 0) {
            const sentence = list[Math.floor(Math.random() * list.length)];
            setCurrentSentence(sentence);
            resetTypingState();
            setState('tasting');
          }
        }, 1500);
      }
    }
  }, [searchParams]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'tasting' && startTime && !stats.wpm && inputValue.length < (currentSentence?.kr.length || 0)) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, startTime, stats.wpm, inputValue, currentSentence]);

  const pickSentence = (genre: string, difficulty: string): Sentence => {
    const category = sentenceData[genre] || sentenceData['daily'];
    const list = category.levels[difficulty] || category.levels['sugar-50'];
    return list[Math.floor(Math.random() * list.length)];
  };

  const handleOrder = () => {
    if (!selectedMenu) return;
    setState('brewing');
    setCompletedCount(0);
    setBatchResults([]);
    
    setTimeout(() => {
      const sentence = pickSentence(selectedMenu.genre, selectedMenu.difficulty);
      setCurrentSentence(sentence);
      resetTypingState();
      setState('tasting');
    }, 1500);
  };

  const resetTypingState = () => {
    setInputValue('');
    setStartTime(null);
    setElapsedTime(0);
    setStats({ wpm: 0, accuracy: 100, mistakes: 0 });
    setAiResult(null);
    // Focus input after reset
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleChangeSentence = () => {
    if (!selectedMenu) return;
    const sentence = pickSentence(selectedMenu.genre, selectedMenu.difficulty);
    setCurrentSentence(sentence);
    resetTypingState();
  };

  const calculateStats = (input: string, target: string) => {
    let correct = 0;
    let mistakes = 0;
    const len = input.length;
    
    for (let i = 0; i < len; i++) {
      if (input[i] === target[i]) correct++;
      else mistakes++;
    }

    const accuracy = len > 0 ? Math.round((correct / len) * 100) : 100;
    return { accuracy, mistakes };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!currentSentence) return;

    // Start timer on first char
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setInputValue(val);

    // Live stats
    const { accuracy, mistakes } = calculateStats(val, currentSentence.kr);
    
    // Calculate WPM live (assuming 5 chars per word)
    const timeInMin = (Date.now() - (startTime || Date.now())) / 1000 / 60;
    const currentWpm = timeInMin > 0 ? Math.round((val.length / 5) / timeInMin) : 0;

    setStats({
      wpm: currentWpm,
      accuracy,
      mistakes
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
      // 允许在 IME 组合过程中提交，以提供更流畅的韩语打字体验
      e.preventDefault();
      finishTyping();
    }
  };

  const finishTyping = () => {
    if (!currentSentence || inputValue.length === 0) return;
    
    // Final calculations
    const timeInSeconds = (Date.now() - (startTime || Date.now())) / 1000;
    const timeInMin = timeInSeconds / 60;
    const finalWpm = timeInMin > 0 ? Math.round((inputValue.length / 5) / timeInMin) : 0;
    const { accuracy, mistakes } = calculateStats(inputValue, currentSentence.kr);

    // AI Analysis
    const analysis = analyzeInput(inputValue, currentSentence.kr, finalWpm);
    setAiResult(analysis);

    // Celebration
    if (accuracy >= 90) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save to Store
    const pointsEarned = Math.round(accuracy / 10) + (finalWpm > 40 ? 5 : 0);
    addPoints(pointsEarned);
    
    addHistory({
      date: Date.now(),
      wpm: finalWpm,
      accuracy: accuracy,
      genre: selectedMenu?.genre || 'unknown',
      difficulty: selectedMenu?.difficulty || 'unknown',
      mistakes: mistakes
    });

    // Save significant mistakes
    analysis.corrections.forEach(c => {
      addMistake({
        original: currentSentence.kr,
        input: inputValue,
        target: c.expected,
        type: c.type as any,
        timestamp: Date.now()
      });
    });

    // Save batch result
    setBatchResults(prev => [...prev, {
      accuracy,
      wpm: finalWpm,
      mistakes,
      sentence: currentSentence.kr,
      duration: timeInSeconds
    }]);

    setStats({ wpm: finalWpm, accuracy, mistakes });

    if (completedCount + 1 < targetCount) {
      // Continue to next sentence
      setCompletedCount(prev => prev + 1);
      
      // Flash success or something could be nice here, but for now just load next
      setTimeout(() => {
        if (selectedMenu) {
          const nextSentence = pickSentence(selectedMenu.genre, selectedMenu.difficulty);
          setCurrentSentence(nextSentence);
          resetTypingState();
        }
      }, 500); // Brief pause
    } else {
      // Finish batch
      setCompletedCount(targetCount);
      setState('receipt');
    }
  };

  // Helper to format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (state === 'ordering') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">今天想喝点什么？</h1>
            <p className="text-gray-600">请选择您的口味，AI 咖啡师将为您现磨专属练习文本。</p>
          </div>

          <div className="space-y-10">
            {/* Genre Selection */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">1</span>
                选择咖啡豆 (题材)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedMenu(prev => ({ ...prev, genre: genre.id, difficulty: prev?.difficulty || '' }))}
                    className={clsx(
                      "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group",
                      selectedMenu?.genre === genre.id
                        ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                        : "border-gray-100 hover:border-amber-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="relative z-10">
                      <div className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">{genre.name}</div>
                      <div className="text-xs text-gray-500">{genre.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">2</span>
                选择甜度 (难度)
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {difficulties.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedMenu(prev => ({ ...prev, genre: prev?.genre || '', difficulty: diff.id }))}
                    className={clsx(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      selectedMenu?.difficulty === diff.id
                        ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                        : "border-gray-100 hover:border-amber-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="font-bold text-gray-900 mb-1">{diff.name}</div>
                    <div className="text-xs text-gray-500">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Count Selection */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">3</span>
                选择份量 (句数)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {[1, 5, 10, 20, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTargetCount(count)}
                    className={clsx(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      targetCount === count
                        ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                        : "border-gray-100 hover:border-amber-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">句</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 text-center">
              <button
                disabled={!selectedMenu?.genre || !selectedMenu?.difficulty}
                onClick={handleOrder}
                className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200 transform hover:-translate-y-1"
              >
                <Coffee className="w-5 h-5 mr-2" />
                确认点单
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'brewing') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
          <Coffee className="absolute inset-0 m-auto w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">正在为您萃取文本...</h2>
        <p className="text-gray-500">AI 咖啡师正在精心挑选最适合您的练习内容</p>
      </div>
    );
  }

  if (state === 'receipt') {
    // Calculate averages
    const avgWpm = Math.round(batchResults.reduce((acc, r) => acc + r.wpm, 0) / batchResults.length);
    const avgAccuracy = Math.round(batchResults.reduce((acc, r) => acc + r.accuracy, 0) / batchResults.length);
    const totalMistakes = batchResults.reduce((acc, r) => acc + r.mistakes, 0);
    const totalDuration = batchResults.reduce((acc, r) => acc + r.duration, 0);

    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-sm shadow-xl border-t-8 border-amber-500 relative animate-slideUp">
        {/* Jagged edge effect */}
        <div className="absolute top-full left-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMEwxMCAxMEwyMCAwWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] bg-repeat-x bg-bottom transform rotate-180"></div>

        <div className="text-center mb-8 border-b-2 border-dashed border-gray-200 pb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Receipt className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-mono">ORDER #2025</h2>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-4 mb-8 font-mono">
          <div className="flex justify-between items-end">
            <span className="text-gray-600">品名</span>
            <span className="font-bold text-gray-900">
              {genres.find(g => g.id === selectedMenu?.genre)?.name} 特调
            </span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-600">份量</span>
            <span className="font-bold text-gray-900">
              {targetCount} 句 ({difficulties.find(d => d.id === selectedMenu?.difficulty)?.name})
            </span>
          </div>
          <div className="border-t border-dashed border-gray-200 my-4"></div>
          <div className="flex justify-between items-end text-lg">
            <span className="text-gray-600">平均正确率</span>
            <span className={clsx("font-bold", avgAccuracy >= 90 ? "text-green-600" : "text-amber-600")}>
              {avgAccuracy}%
            </span>
          </div>
          <div className="flex justify-between items-end text-lg">
            <span className="text-gray-600">平均速度</span>
            <span className="font-bold text-blue-600">{avgWpm} WPM</span>
          </div>
          <div className="flex justify-between items-end text-lg">
            <span className="text-gray-600">总用时</span>
            <span className="font-bold text-gray-600">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* AI Feedback Section */}
        <div className="space-y-4">
          <div className={clsx(
            "p-4 rounded-lg text-sm border",
            avgAccuracy >= 90 ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"
          )}>
            <div className="flex items-center gap-2 mb-2 font-bold">
              {avgAccuracy >= 90 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              AI 咖啡师点评
            </div>
            <p>
              {avgAccuracy >= 95 ? "完美的表现！这一批次的制作非常稳定，口感极佳。" :
               avgAccuracy >= 85 ? "很棒！整体表现不错，只有少量瑕疵。" :
               "继续加油！有些句子可能比较棘手，建议多加练习。"}
            </p>
          </div>

          {/* Detailed Corrections */}
          {aiResult?.corrections && aiResult.corrections.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
              <h4 className="font-bold text-gray-700 mb-2">最后一句详细纠错:</h4>
              {aiResult.corrections.map((c, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                   <span className="text-red-500 shrink-0">[{c.type}]</span>
                   <span>{c.explanation}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 mt-6">
             <button 
              onClick={() => {
                // Restart same batch
                setCompletedCount(0);
                setBatchResults([]);
                handleChangeSentence();
                setState('tasting');
              }}
              className="py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              再来一批
            </button>
            <button 
              onClick={() => setState('ordering')}
              className="py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              新订单
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tasting (Typing) State
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">当前进度</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">{completedCount + 1}/{targetCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Coffee className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">纯净度 (正确率)</p>
            <p className={clsx("text-2xl font-bold font-mono", stats.accuracy >= 90 ? "text-green-600" : "text-amber-600")}>
              {stats.accuracy}%
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">流速 (WPM)</p>
            <p className="text-2xl font-bold text-blue-600 font-mono">{stats.wpm}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 md:p-12 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
        
        <div className="mb-8 relative z-10">
          <div className="text-3xl md:text-4xl font-bold text-gray-800 leading-relaxed font-serif break-keep mb-2">
            {currentSentence?.kr.split('').map((char, index) => {
              let colorClass = 'text-gray-400'; // Default untyped
              if (index < inputValue.length) {
                colorClass = inputValue[index] === char ? 'text-gray-800' : 'text-red-500 bg-red-50';
              } else if (index === inputValue.length) {
                colorClass = 'text-gray-800 underline decoration-amber-500 decoration-2 underline-offset-4'; // Current cursor
              }
              return (
                <span key={index} className={colorClass}>{char}</span>
              );
            })}
          </div>
          <p className="text-gray-400 mt-4 text-lg font-medium">{currentSentence?.cn}</p>
        </div>

        <div className="max-w-2xl mx-auto relative z-10 w-full">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all outline-none pr-16"
            placeholder="在此输入韩文..."
            autoFocus
            autoComplete="off"
          />
          <button 
            onClick={finishTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
            title="提交 (Enter)"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-8 flex justify-center z-10 relative">
          <button 
            onClick={handleChangeSentence}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            换一句
          </button>
        </div>
      </div>
    </div>
  );
};

export default Typing;
