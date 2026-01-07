import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Brain, Calculator, Keyboard, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ChallengeType = 'math' | 'pattern' | 'typing' | 'memory';

interface Challenge {
  type: ChallengeType;
  question: string;
  answer: string;
  options?: string[];
  timeLimit: number; // seconds
}

interface AntiCheatChallengeProps {
  onComplete: (passed: boolean, responseTimeMs: number) => void;
  onTimeout: () => void;
}

const generateMathChallenge = (): Challenge => {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 30;
      b = Math.floor(Math.random() * 30) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    default:
      a = 10; b = 5; answer = 15;
  }

  return {
    type: 'math',
    question: `${a} ${op} ${b} = ?`,
    answer: answer.toString(),
    timeLimit: 15,
  };
};

const generatePatternChallenge = (): Challenge => {
  const patterns = [
    { sequence: [2, 4, 6, 8], next: '10', hint: 'Even numbers' },
    { sequence: [1, 3, 5, 7], next: '9', hint: 'Odd numbers' },
    { sequence: [3, 6, 9, 12], next: '15', hint: 'Multiples of 3' },
    { sequence: [1, 2, 4, 8], next: '16', hint: 'Powers of 2' },
    { sequence: [1, 1, 2, 3, 5], next: '8', hint: 'Fibonacci' },
    { sequence: [5, 10, 15, 20], next: '25', hint: 'Multiples of 5' },
  ];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  return {
    type: 'pattern',
    question: `What comes next? ${pattern.sequence.join(', ')}, ?`,
    answer: pattern.next,
    timeLimit: 20,
  };
};

const generateTypingChallenge = (): Challenge => {
  const phrases = [
    'focus mode',
    'stay productive',
    'deep work',
    'no distractions',
    'keep going',
    'almost there',
    'you got this',
    'stay sharp',
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  return {
    type: 'typing',
    question: `Type: "${phrase}"`,
    answer: phrase.toLowerCase(),
    timeLimit: 10,
  };
};

const generateMemoryChallenge = (): Challenge => {
  const colors = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
  const length = 4;
  const sequence = Array.from({ length }, () => 
    colors[Math.floor(Math.random() * colors.length)]
  );
  
  // Create wrong options
  const options = [sequence.join('')];
  while (options.length < 4) {
    const wrongSeq = Array.from({ length }, () => 
      colors[Math.floor(Math.random() * colors.length)]
    ).join('');
    if (!options.includes(wrongSeq)) {
      options.push(wrongSeq);
    }
  }
  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  return {
    type: 'memory',
    question: `Remember this pattern: ${sequence.join(' ')}`,
    answer: sequence.join(''),
    options,
    timeLimit: 10,
  };
};

const generateChallenge = (): Challenge => {
  const types: ChallengeType[] = ['math', 'pattern', 'typing', 'memory'];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'math': return generateMathChallenge();
    case 'pattern': return generatePatternChallenge();
    case 'typing': return generateTypingChallenge();
    case 'memory': return generateMemoryChallenge();
    default: return generateMathChallenge();
  }
};

const challengeIcons: Record<ChallengeType, React.ReactNode> = {
  math: <Calculator className="w-6 h-6" />,
  pattern: <Grid3X3 className="w-6 h-6" />,
  typing: <Keyboard className="w-6 h-6" />,
  memory: <Brain className="w-6 h-6" />,
};

export const AntiCheatChallenge: React.FC<AntiCheatChallengeProps> = ({
  onComplete,
  onTimeout,
}) => {
  const [challenge, setChallenge] = useState<Challenge>(() => generateChallenge());
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [showQuestion, setShowQuestion] = useState(true);
  const [startTime] = useState(Date.now());

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeout]);

  // For memory challenge, hide after 3 seconds
  useEffect(() => {
    if (challenge.type === 'memory' && showQuestion) {
      const timer = setTimeout(() => {
        setShowQuestion(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [challenge.type, showQuestion]);

  const handleSubmit = useCallback(() => {
    const responseTime = Date.now() - startTime;
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    const passed = normalizedAnswer === challenge.answer.toLowerCase();
    onComplete(passed, responseTime);
  }, [userAnswer, challenge.answer, startTime, onComplete]);

  const handleOptionSelect = useCallback((option: string) => {
    const responseTime = Date.now() - startTime;
    const passed = option === challenge.answer;
    onComplete(passed, responseTime);
  }, [challenge.answer, startTime, onComplete]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-60 flex items-center justify-center px-6">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center animate-scale-in">
        {/* Timer */}
        <div className={cn(
          "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
          timeLeft <= 5 ? "bg-destructive/20 text-destructive animate-pulse" : "bg-secondary text-muted-foreground"
        )}>
          {timeLeft}
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          {challengeIcons[challenge.type]}
        </div>

        {/* Challenge type label */}
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3 capitalize">
          {challenge.type} Challenge
        </span>

        {/* Question */}
        <h3 className="text-xl font-bold text-foreground mb-4">
          {challenge.type === 'memory' && !showQuestion 
            ? 'Select the correct pattern!'
            : challenge.question
          }
        </h3>

        {/* Answer input or options */}
        {challenge.type === 'memory' && challenge.options ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {!showQuestion && challenge.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-14 text-lg"
                onClick={() => handleOptionSelect(option)}
              >
                {option.split('').map((char, i) => (
                  <span key={i}>{char}</span>
                ))}
              </Button>
            ))}
            {showQuestion && (
              <div className="col-span-2 text-muted-foreground text-sm animate-pulse">
                Memorizing...
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <Input
              type={challenge.type === 'math' || challenge.type === 'pattern' ? 'number' : 'text'}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={challenge.type === 'typing' ? 'Type here...' : 'Enter answer...'}
              className="text-center text-lg"
              autoFocus
            />
          </div>
        )}

        {/* Submit button (not for memory type) */}
        {challenge.type !== 'memory' && (
          <Button
            variant="glow"
            size="lg"
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {/* Warning */}
        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Failing will add a verification warning
        </p>
      </div>
    </div>
  );
};