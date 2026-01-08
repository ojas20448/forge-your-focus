import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Mic, Keyboard, Calculator, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useProfile } from '@/hooks/useProfile';
import { hapticFeedback } from '@/utils/hapticFeedback';

type ChallengeType = 'button' | 'math' | 'pattern' | 'typing' | 'camera' | 'voice';

interface Challenge {
  type: ChallengeType;
  question: string;
  answer: string;
  options?: string[];
  pattern?: number[];
  typingText?: string;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPass: () => void;
  onFail: () => void;
  sessionId: string | null;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onPass,
  onFail,
  sessionId,
}) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const { recordChallenge } = useAntiCheat();
  const { profile } = useProfile();

  useEffect(() => {
    if (isOpen) {
      generateChallenge();
      setStartTime(Date.now());
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const getDifficultyLevel = (): number => {
    // Scale difficulty with user level (1-5)
    const level = profile?.level || 1;
    if (level < 5) return 1;
    if (level < 15) return 2;
    if (level < 30) return 3;
    if (level < 50) return 4;
    return 5;
  };

  const generateChallenge = () => {
    const difficulty = getDifficultyLevel();
    const types: ChallengeType[] = ['button', 'math', 'pattern', 'typing'];
    
    // Add camera/voice at higher difficulties
    if (difficulty >= 3) {
      types.push('camera');
    }
    if (difficulty >= 4) {
      types.push('voice');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    
    setUserAnswer('');
    setSelectedPattern([]);
    setTimeLeft(30);
    setCameraReady(false);
    setIsRecording(false);

    switch (type) {
      case 'math':
        setChallenge(generateMathChallenge(difficulty));
        break;
      case 'pattern':
        setChallenge(generatePatternChallenge(difficulty));
        break;
      case 'typing':
        setChallenge(generateTypingChallenge(difficulty));
        break;
      case 'camera':
        setChallenge(generateCameraChallenge());
        break;
      case 'voice':
        setChallenge(generateVoiceChallenge());
        break;
      default:
        setChallenge(generateButtonChallenge());
    }
  };

  const generateMathChallenge = (difficulty: number): Challenge => {
    let question: string;
    let answer: number;

    switch (difficulty) {
      case 1:
        // Simple addition/subtraction
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        answer = op === '+' ? a + b : a - b;
        question = `${a} ${op} ${b}`;
        break;
      case 2:
        // Multiplication/division
        const x = Math.floor(Math.random() * 12) + 2;
        const y = Math.floor(Math.random() * 12) + 2;
        const op2 = Math.random() > 0.5 ? '×' : '÷';
        if (op2 === '×') {
          answer = x * y;
          question = `${x} × ${y}`;
        } else {
          answer = x;
          question = `${x * y} ÷ ${y}`;
        }
        break;
      case 3:
        // Two-step operations
        const n1 = Math.floor(Math.random() * 15) + 1;
        const n2 = Math.floor(Math.random() * 15) + 1;
        const n3 = Math.floor(Math.random() * 10) + 1;
        answer = (n1 + n2) * n3;
        question = `(${n1} + ${n2}) × ${n3}`;
        break;
      case 4:
        // Square roots and powers
        const base = Math.floor(Math.random() * 8) + 2;
        answer = base * base;
        question = `${base}²`;
        break;
      default:
        // Complex operations
        const p1 = Math.floor(Math.random() * 10) + 2;
        const p2 = Math.floor(Math.random() * 10) + 2;
        const p3 = Math.floor(Math.random() * 5) + 1;
        answer = p1 * p2 - p3;
        question = `${p1} × ${p2} - ${p3}`;
    }

    return {
      type: 'math',
      question: `Solve: ${question}`,
      answer: answer.toString(),
    };
  };

  const generatePatternChallenge = (difficulty: number): Challenge => {
    const gridSize = Math.min(3 + difficulty, 6);
    const numTiles = Math.min(3 + difficulty, Math.floor(gridSize * gridSize / 2));
    
    const pattern: number[] = [];
    while (pattern.length < numTiles) {
      const tile = Math.floor(Math.random() * gridSize * gridSize);
      if (!pattern.includes(tile)) {
        pattern.push(tile);
      }
    }

    return {
      type: 'pattern',
      question: 'Memorize and repeat this pattern',
      answer: pattern.join(','),
      pattern,
    };
  };

  const generateTypingChallenge = (difficulty: number): Challenge => {
    const phrases = [
      ['focus', 'work', 'study', 'learn', 'grow'],
      ['I am focused', 'Stay on track', 'Deep work mode', 'No distractions'],
      ['Discipline equals freedom', 'Focus brings results', 'Consistency is key'],
      ['The only way to do great work is to love what you do', 'Success is the sum of small efforts'],
      ['Excellence is not a destination it is a continuous journey that never ends'],
    ];

    const text = phrases[Math.min(difficulty - 1, phrases.length - 1)][
      Math.floor(Math.random() * phrases[Math.min(difficulty - 1, phrases.length - 1)].length)
    ];

    return {
      type: 'typing',
      question: 'Type this exactly:',
      answer: text,
      typingText: text,
    };
  };

  const generateCameraChallenge = (): Challenge => {
    return {
      type: 'camera',
      question: 'Take a selfie to verify you\'re present',
      answer: 'camera_verified',
    };
  };

  const generateVoiceChallenge = (): Challenge => {
    const phrases = ['I am focused', 'Still working', 'On track', 'Deep work'];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    return {
      type: 'voice',
      question: `Say: "${phrase}"`,
      answer: phrase,
    };
  };

  const generateButtonChallenge = (): Challenge => {
    return {
      type: 'button',
      question: 'Are you still focused?',
      answer: 'yes',
    };
  };

  const handleTimeout = async () => {
    await hapticFeedback.trigger('error');
    const responseTime = Date.now() - startTime;
    
    await recordChallenge(
      sessionId,
      challenge?.type || 'button',
      { question: challenge?.question, timeout: true },
      false,
      responseTime
    );
    
    onFail();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const responseTime = Date.now() - startTime;
    let isPassed = false;
    let answerData: Record<string, unknown> = {
      question: challenge?.question,
      userAnswer,
    };

    switch (challenge?.type) {
      case 'math':
      case 'typing':
        isPassed = userAnswer.trim().toLowerCase() === challenge.answer.toLowerCase();
        break;
      case 'pattern':
        isPassed = selectedPattern.join(',') === challenge.answer;
        answerData.selectedPattern = selectedPattern;
        break;
      case 'camera':
        isPassed = cameraReady;
        answerData.cameraVerified = cameraReady;
        break;
      case 'voice':
        isPassed = isRecording; // Simplified - in production, use speech recognition
        answerData.voiceRecorded = isRecording;
        break;
      default:
        isPassed = userAnswer === 'yes';
    }

    await recordChallenge(
      sessionId,
      challenge?.type || 'button',
      answerData,
      isPassed,
      responseTime
    );

    if (isPassed) {
      await hapticFeedback.trigger('success');
      onPass();
    } else {
      await hapticFeedback.trigger('error');
      onFail();
    }

    setIsSubmitting(false);
  };

  const handlePatternTileClick = (index: number) => {
    if (selectedPattern.includes(index)) {
      setSelectedPattern(selectedPattern.filter(i => i !== index));
    } else {
      setSelectedPattern([...selectedPattern, index]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        setCameraReady(true);
        // Stop camera stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      // Simulate 2-second recording
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }, 2000);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  if (!isOpen || !challenge) return null;

  const renderChallengeContent = () => {
    switch (challenge.type) {
      case 'math':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <Calculator className="w-8 h-8 text-primary" />
              <p className="text-2xl font-bold text-foreground">{challenge.question}</p>
            </div>
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="text-center text-2xl h-14"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        );

      case 'pattern':
        const gridSize = Math.sqrt(challenge.pattern!.length * 2);
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <Grid3x3 className="w-6 h-6 text-primary" />
              <p className="text-lg font-semibold">{challenge.question}</p>
            </div>
            
            {/* Show pattern briefly */}
            {timeLeft > 25 ? (
              <div className={cn(
                "grid gap-2 mx-auto",
                `grid-cols-${Math.ceil(gridSize)}`
              )} style={{ maxWidth: '300px' }}>
                {Array.from({ length: Math.ceil(gridSize) * Math.ceil(gridSize) }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-lg transition-colors",
                      challenge.pattern!.includes(i)
                        ? "bg-primary"
                        : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className={cn(
                "grid gap-2 mx-auto",
                `grid-cols-${Math.ceil(gridSize)}`
              )} style={{ maxWidth: '300px' }}>
                {Array.from({ length: Math.ceil(gridSize) * Math.ceil(gridSize) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePatternTileClick(i)}
                    className={cn(
                      "aspect-square rounded-lg transition-all border-2",
                      selectedPattern.includes(i)
                        ? "bg-primary border-primary"
                        : "bg-secondary border-border hover:border-primary/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'typing':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <Keyboard className="w-6 h-6 text-primary" />
              <p className="font-semibold">{challenge.question}</p>
            </div>
            <p className="text-xl font-mono text-center p-4 bg-secondary rounded-xl">
              {challenge.typingText}
            </p>
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type here..."
              className="text-center h-12"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <p className={cn(
              "text-sm text-center",
              userAnswer === challenge.typingText ? "text-green-500" : "text-muted-foreground"
            )}>
              {userAnswer.length} / {challenge.typingText?.length} characters
            </p>
          </div>
        );

      case 'camera':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <Camera className="w-6 h-6 text-primary" />
              <p className="font-semibold">{challenge.question}</p>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden">
              {!cameraReady ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-60 object-cover"
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={240}
                  className="w-full h-60 object-cover"
                />
              )}
            </div>
            {!cameraReady && (
              <Button onClick={videoRef.current?.srcObject ? capturePhoto : startCamera} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                {videoRef.current?.srcObject ? 'Capture Photo' : 'Start Camera'}
              </Button>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <Mic className="w-6 h-6 text-primary" />
              <p className="font-semibold">{challenge.question}</p>
            </div>
            <div className="text-center space-y-4">
              <div className={cn(
                "mx-auto w-24 h-24 rounded-full flex items-center justify-center",
                isRecording ? "bg-red-500 animate-pulse" : "bg-primary"
              )}>
                <Mic className="w-12 h-12 text-white" />
              </div>
              <Button
                onClick={startVoiceRecording}
                disabled={isRecording}
                className="w-full"
              >
                {isRecording ? 'Recording...' : 'Start Recording'}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-xl font-semibold text-center">{challenge.question}</p>
            <Button
              onClick={() => {
                setUserAnswer('yes');
                setTimeout(handleSubmit, 100);
              }}
              className="w-full h-14 text-lg"
            >
              Yes, I'm Focused! ✓
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Verification Check</h2>
            <p className="text-sm text-muted-foreground">
              Level {getDifficultyLevel()} Challenge
            </p>
          </div>
          <div className={cn(
            "text-3xl font-bold px-4 py-2 rounded-lg",
            timeLeft <= 10 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary"
          )}>
            {timeLeft}s
          </div>
        </div>

        {/* Challenge Content */}
        {renderChallengeContent()}

        {/* Actions */}
        <div className="flex gap-3">
          {challenge.type !== 'button' && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (challenge.type === 'camera' && !cameraReady)}
              className="flex-1 h-12"
            >
              {isSubmitting ? 'Checking...' : 'Submit'}
            </Button>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" width={320} height={240} />
      </div>
    </div>
  );
};
