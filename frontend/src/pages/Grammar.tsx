import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, CheckCircle2, AlertCircle, BookOpen, Clock, MessageSquare, Award, Target } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { grammarData, GrammarCategory, GrammarRule } from '../data/grammarData';
import { analyzeInput, AIAnalysisResult } from '../utils/aiBarista';

const Grammar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(grammarData[0].id);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(grammarData[0].items[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Practice State
  const [practiceInput, setPracticeInput] = useState('');
  const [feedback, setFeedback] = useState<AIAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<{cn: string, kr: string} | null>(null);

  // Initialize selection from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const ruleParam = searchParams.get('rule');

    if (categoryParam) {
      const categoryExists = grammarData.find(c => c.id === categoryParam);
      if (categoryExists) {
        setSelectedCategory(categoryParam);
        if (ruleParam) {
          const ruleExists = categoryExists.items.find(r => r.id === ruleParam);
          if (ruleExists) {
            setSelectedRuleId(ruleParam);
          }
        } else {
          // Default to first item if only category is provided
          setSelectedRuleId(categoryExists.items[0].id);
        }
      }
    }
  }, [searchParams]);

  // Find current active data
  const currentCategory = grammarData.find(c => c.id === selectedCategory) || grammarData[0];
  const currentRule = currentCategory.items.find(i => i.id === selectedRuleId) || currentCategory.items[0];

  // Update challenge when rule changes
  useEffect(() => {
    if (currentRule && currentRule.examples.length > 0) {
        // Pick a random example as challenge
        const randomEx = currentRule.examples[Math.floor(Math.random() * currentRule.examples.length)];
        setCurrentChallenge(randomEx);
        setPracticeInput('');
        setFeedback(null);
    }
  }, [currentRule]);

  const handlePracticeSubmit = () => {
    if (!practiceInput.trim() || !currentChallenge) return;
    
    setIsSubmitting(true);
    setFeedback(null);

    // Mock AI analysis simulation with real logic
    setTimeout(() => {
      const result = analyzeInput(practiceInput, currentChallenge.kr, 0); // WPM 0 as it's not timed
      setFeedback(result);
      setIsSubmitting(false);
    }, 800);
  };

  // Helper to render sidebar items
  const renderSidebarItem = (item: GrammarRule) => (
    <button
      key={item.id}
      onClick={() => setSelectedRuleId(item.id)}
      className={clsx(
        "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all group text-left",
        selectedRuleId === item.id
          ? "bg-amber-100 text-amber-900 font-medium shadow-sm" 
          : "text-gray-700 hover:bg-amber-50"
      )}
    >
      <span className="truncate pr-2">{item.title}</span>
      {selectedRuleId === item.id && <ChevronRight className="w-3 h-3 text-amber-600 flex-shrink-0" />}
    </button>
  );

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'particles': return <BookOpen className="w-3 h-3" />;
      case 'tenses': return <Clock className="w-3 h-3" />;
      case 'connectors': return <MessageSquare className="w-3 h-3" />;
      case 'honorifics': return <Award className="w-3 h-3" />;
      default: return <BookOpen className="w-3 h-3" />;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-amber-100 bg-amber-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          
          {grammarData.map((category) => (
            <div key={category.id} className="space-y-1">
              <div 
                className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:text-amber-600 transition-colors"
                onClick={() => setSelectedCategory(category.id)}
              >
                {getCategoryIcon(category.id)}
                {category.name}
              </div>
              {/* Only show items if category matches search or is selected (optional logic, kept simple for now) */}
              {(selectedCategory === category.id || searchQuery) && (
                <div className="pl-2 border-l-2 border-amber-50 ml-1.5 space-y-1">
                  {category.items
                    .filter(item => item.title.includes(searchQuery) || item.summary.includes(searchQuery))
                    .map(item => renderSidebarItem(item))}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-amber-100 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto animate-fadeIn">
          <div className="mb-6 flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wide">
              {currentCategory.name}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              难度: <span className={clsx(
                "font-medium",
                currentRule.level === 'Basic' ? "text-green-600" :
                currentRule.level === 'Intermediate' ? "text-amber-600" : "text-red-600"
              )}>{currentRule.level}</span>
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
            {currentRule.title}
          </h1>
          <p className="text-gray-500 text-lg mb-8 font-light italic">
            {currentRule.summary}
          </p>

          <div className="prose prose-amber max-w-none">
            <div className="bg-amber-50/50 rounded-xl p-6 mb-8 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2">基本结构</h3>
              <p className="text-xl font-mono text-gray-900 bg-white inline-block px-3 py-1 rounded border border-amber-200">
                {currentRule.structure}
              </p>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {currentRule.description}
            </p>

            {currentRule.usageNotes && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                  使用注意
                </h3>
                <ul className="space-y-2 mb-8 list-disc list-inside text-gray-700 bg-gray-50 p-5 rounded-xl">
                  {currentRule.usageNotes.map((note, idx) => (
                    <li key={idx} className="leading-relaxed">{note}</li>
                  ))}
                </ul>
              </>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              例句赏析
            </h3>
            <div className="space-y-4 mb-8">
              {currentRule.examples.map((ex, idx) => (
                <div key={idx} className="p-5 border border-gray-100 rounded-xl hover:border-amber-300 hover:shadow-md transition-all bg-white group">
                  <p className="text-xl font-medium text-gray-900 mb-2 font-serif group-hover:text-amber-700 transition-colors">{ex.kr}</p>
                  <p className="text-gray-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    {ex.cn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Practice Panel (Right Side) */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-amber-100 flex flex-col">
        <div className="p-4 border-b border-amber-100 bg-amber-50/30 rounded-t-xl">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            即时练习
          </h3>
          <p className="text-xs text-gray-500 mt-1">趁热打铁，造个句子试试？</p>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
              <div className="flex gap-2 mb-2">
                <Target className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="font-bold">
                  {selectedCategory === 'alphabet' ? '发音/拼写挑战' : '翻译挑战'}
                </p>
              </div>
              <p className="pl-6 text-gray-700">
                {selectedCategory === 'alphabet' ? '请尝试输入对应的韩字：' : '请尝试翻译：'}
                <span className="block mt-1 font-medium text-lg text-blue-900">
                  {currentChallenge?.cn || "正在加载..."}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <textarea 
                value={practiceInput}
                onChange={(e) => setPracticeInput(e.target.value)}
                className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none transition-all placeholder:text-gray-400 font-serif"
                placeholder={selectedCategory === 'alphabet' ? "在此输入韩语字母或音节..." : "在此输入韩文句子..."}
                disabled={isSubmitting}
              ></textarea>
              <button 
                onClick={handlePracticeSubmit}
                disabled={isSubmitting || !practiceInput.trim()}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'AI 正在品鉴...' : '提交给 AI 批改'}
              </button>
            </div>

            {/* AI Feedback Display */}
            {feedback && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI 咖啡师反馈</h4>
                <div className={clsx(
                  "p-3 rounded-lg border mb-3",
                  feedback.score >= 90 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                )}>
                  <div className={clsx(
                    "flex items-center gap-2 font-medium text-sm mb-1",
                    feedback.score >= 90 ? "text-green-700" : "text-amber-700"
                  )}>
                    {feedback.score >= 90 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {feedback.score >= 90 ? "味道不错！" : "还可以更好"}
                    <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded-full">
                      准确度: {feedback.score}%
                    </span>
                  </div>
                  <p className={clsx(
                    "text-xs leading-relaxed",
                    feedback.score >= 90 ? "text-green-600" : "text-amber-600"
                  )}>
                    "{feedback.feedback}"
                  </p>
                </div>

                {/* Detailed Corrections */}
                {feedback.corrections.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">详细建议:</p>
                    {feedback.corrections.map((corr, idx) => (
                      <div key={idx} className="bg-red-50 p-2 rounded border border-red-100 text-xs">
                        <div className="flex gap-2">
                          <span className="font-bold text-red-700 min-w-[3rem] uppercase text-[10px] tracking-wider border border-red-200 px-1 rounded text-center h-fit mt-0.5">
                            {corr.type === 'particle' ? '助词' : 
                             corr.type === 'spacing' ? '空格' : 
                             corr.type === 'missing' ? '漏词' : 
                             corr.type === 'extra' ? '多词' : '拼写'}
                          </span>
                          <div className="flex-1 text-red-800">
                             <p>{corr.explanation}</p>
                             <div className="mt-1 flex gap-2 font-mono text-[10px] bg-white/50 p-1 rounded">
                               <span className="text-red-400 line-through">{corr.actual || '(空)'}</span>
                               <span className="text-green-600">→ {corr.expected}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grammar;
