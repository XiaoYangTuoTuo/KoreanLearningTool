import DiffMatchPatch from 'diff-match-patch';

export interface AIAnalysisResult {
  score: number;
  feedback: string;
  corrections: Array<{
    type: 'spelling' | 'particle' | 'spacing' | 'missing' | 'extra';
    position: number;
    expected: string;
    actual: string;
    explanation: string;
  }>;
}

// Simple heuristic to detect particles (very basic for now)
const PARTICLES = ['은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로', '의', '도', '만', '과', '와'];

export const analyzeInput = (input: string, target: string, wpm: number): AIAnalysisResult => {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(target, input);
  dmp.diff_cleanupSemantic(diffs);
  
  let mistakes = 0;
  const corrections: AIAnalysisResult['corrections'] = [];
  
  let currentIndex = 0;

  for (let i = 0; i < diffs.length; i++) {
    const [op, text] = diffs[i];
    
    if (op === 0) {
      currentIndex += text.length;
      continue;
    }

    if (op === -1) { // Missing from input (Target has it, Input doesn't)
      // Check if next is Insert (Substitution)
      if (i + 1 < diffs.length && diffs[i+1][0] === 1) {
        const nextText = diffs[i+1][1];
        
        // Check for Particle Error
        if (PARTICLES.includes(text) || PARTICLES.includes(nextText)) {
          corrections.push({
            type: 'particle',
            position: currentIndex,
            expected: text,
            actual: nextText,
            explanation: `助词混淆：此处应使用 "${text}"，您误用了 "${nextText}"。`
          });
        } else if (text === ' ' && nextText !== ' ') {
           corrections.push({
            type: 'spacing',
            position: currentIndex,
            expected: '[空格]',
            actual: nextText,
            explanation: '分写错误：此处应该留有空格，韩语分写会影响语义哦。'
          });
        } else {
           corrections.push({
            type: 'spelling',
            position: currentIndex,
            expected: text,
            actual: nextText,
            explanation: `拼写错误：标准写法是 "${text}"，请注意收音。`
          });
        }
        i++; // Skip next insert as we handled it as substitution
      } else {
        // Pure deletion
        corrections.push({
          type: 'missing',
          position: currentIndex,
          expected: text,
          actual: '',
          explanation: `遗漏：您漏掉了 "${text}"，请仔细听/看原句。`
        });
      }
      mistakes++;
    } else if (op === 1) { // Extra in input
      corrections.push({
        type: 'extra',
        position: currentIndex,
        expected: '',
        actual: text,
        explanation: `冗余：您多打了 "${text}"，保持简洁。`
      });
      mistakes++;
    }
  }

  // Calculate AI Score (0-100) based on Levenshtein-like logic derived from mistakes
  const totalLen = Math.max(input.length, target.length);
  const accuracy = totalLen === 0 ? 100 : Math.max(0, Math.round(((totalLen - mistakes) / totalLen) * 100));
  
  let feedback = "";
  
  if (accuracy === 100) {
    if (wpm > 60) {
      feedback = "⚡️ 神乎其技！您的速度和准确率都达到了母语者水平，简直是完美的演出！";
    } else if (wpm > 40) {
      feedback = "🌟 完美无瑕！精准度满分，保持这个节奏，尝试稍微提升一点速度会更棒！";
    } else {
      feedback = "✨ 准确度满分！您非常仔细，现在的重点可以放在提升打字速度上了。";
    }
  } else if (accuracy >= 90) {
    if (mistakes <= 2) {
      feedback = "👍 非常出色！只有一两处微小的瑕疵，几乎就是完美。请查看下方的具体纠错。";
    } else {
      feedback = "👌 很好！整体结构掌握得不错，注意一些细节上的拼写和助词。";
    }
  } else if (accuracy >= 80) {
    feedback = "📝 做得不错，但有一些明显的错误。韩语的助词和词尾变化比较丰富，建议多加练习。";
  } else if (accuracy >= 60) {
    feedback = "💪 万事开头难。您似乎对句子结构还不太熟悉，建议先慢下来，看清每一个字再输入。";
  } else {
    feedback = "🌱 不要灰心，这句确实比较难。建议您可以先从“全糖（简单）”模式开始练习，建立信心！";
  }

  return {
    score: accuracy,
    feedback,
    corrections
  };
};
