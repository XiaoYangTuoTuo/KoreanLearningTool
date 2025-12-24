import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Book, ArrowRight, Star, Clock, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section with AI Barista */}
      <section className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        
        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>您的专属 AI 咖啡师已上线</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                欢迎光临 <span className="text-amber-600">아아咖啡厅</span>
              </h1>
              <p className="text-lg text-gray-600">
                "您好！今天想喝点什么？我是您的 AI 咖啡师。我可以根据您的口味（水平）为您调制专属的朝鲜语学习计划。"
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  to="/typing"
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                >
                  <Coffee className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-xs text-gray-300">今日推荐</p>
                    <p className="font-bold">来一杯 "아아" (打字练习)</p>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Barista Illustration Placeholder */}
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative w-48 h-48 bg-amber-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-6xl">🦙☕</span>
                <div className="absolute -bottom-4 bg-white px-4 py-2 rounded-lg shadow-md border border-amber-50 text-sm font-medium text-gray-700">
                  AI Barista
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Board (Features) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link 
          to="/typing"
          className="group relative overflow-hidden bg-white rounded-xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Coffee className="w-32 h-32 text-amber-900" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 mb-4 group-hover:scale-110 transition-transform">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">每日特调 (打字练习)</h3>
            <p className="text-gray-500 mb-4">
              像品尝一杯冰美式(아아)一样清爽。AI 咖啡师为您挑选最适合的练习文本，生成详细的“品鉴报告”。
            </p>
            <div className="flex items-center text-amber-600 font-medium text-sm">
              去点单 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link 
          to="/grammar"
          className="group relative overflow-hidden bg-white rounded-xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Book className="w-32 h-32 text-amber-900" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 mb-4 group-hover:scale-110 transition-transform">
              <Book className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">研读时光 (语法学习)</h3>
            <p className="text-gray-500 mb-4">
              在咖啡香气中静心学习。系统化整理语法知识点，配合 AI 智能纠错，如同私教在旁指导。
            </p>
            <div className="flex items-center text-amber-600 font-medium text-sm">
              开始研读 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Progress & Recommendations */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recommended Menu */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              咖啡师推荐 Menu
            </h2>
            <Link to="/typing" className="text-sm text-amber-600 hover:text-amber-700 font-medium">查看完整菜单</Link>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Link 
              to="/typing?genre=idioms&difficulty=sugar-100"
              className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                  俗语 & 成语
                </span>
                <span className="text-xs text-gray-400">甜度(难度): 60%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">韩国人的智慧</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                学习 "灯下黑"、"积少成多" 等地道俗语，像韩国人一样思考。
              </p>
            </Link>
            
            <Link 
              to="/typing?genre=literature&difficulty=sugar-100"
              className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                  文学名句
                </span>
                <span className="text-xs text-gray-400">甜度(难度): 80%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">金素月 - 金达莱花</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                沉浸在韩国现代诗歌的优美意境中，提升文学素养。
              </p>
            </Link>

            <Link 
              to="/grammar?category=drama-expressions"
              className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-pink-700 bg-pink-50 px-2 py-1 rounded border border-pink-100">
                  韩剧口语
                </span>
                <span className="text-xs text-gray-400">甜度(难度): 45%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">名台词中的语法</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                学习 "-잖아", "-구나" 等地道口语，像韩剧主角一样表达情感。
              </p>
            </Link>

            <Link 
              to="/grammar?category=topik-advanced"
              className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                  TOPIK 高级
                </span>
                <span className="text-xs text-gray-400">甜度(难度): 95%</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">高级逻辑表达</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                学习 "-을 리가 없다", "-는 커녕" 等高级语法，表达细腻情感。
              </p>
            </Link>
          </div>
        </section>

        {/* Loyalty Card (Progress) */}
        <section className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            会员积分卡
          </h2>
          
          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">本周目标</span>
                <span className="font-medium text-amber-700">45%</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 border-dashed">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-900">集点卡</span>
                <span className="text-xs text-amber-600">再集 2 点兑换奖励</span>
              </div>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= 3 ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-gray-300'}`}>
                    {i <= 3 ? <Coffee className="w-4 h-4" /> : i}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-amber-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">消费记录 (最近活动)</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  完成一杯 "K-Pop 歌词" 特调
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                  研读 "过去时态" 讲义
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
