/**
 * Voice Recognition Utility
 * Uses Web Speech API for voice-to-text input
 */

interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  language?: string;
}

class VoiceRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;

  constructor() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;

    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
    }
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  start(options: VoiceRecognitionOptions): void {
    if (!this.recognition) {
      options.onError?.('Voice recognition not supported in this browser');
      return;
    }

    // Configure recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = true;
    this.recognition.lang = options.language ?? 'en-US';

    // Set up event handlers
    this.recognition.onstart = () => {
      options.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        options.onResult(transcript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Voice recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your device.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }
      options.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      options.onEnd?.();
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      options.onError?.('Failed to start voice recognition');
    }
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }
}

// Export singleton instance
export const voiceRecognition = new VoiceRecognitionManager();

// React hook for easy integration
import { useState, useCallback } from 'react';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const startListening = useCallback((language: string = 'en-US') => {
    if (!voiceRecognition.isAvailable()) {
      setError('Voice recognition is not supported in your browser. Try Chrome, Edge, or Safari.');
      return;
    }

    setError(null);
    setTranscript('');
    
    voiceRecognition.start({
      onStart: () => setIsListening(true),
      onResult: (result) => {
        setTranscript(result);
      },
      onError: (err) => {
        setError(err);
        setIsListening(false);
      },
      onEnd: () => setIsListening(false),
      continuous: false,
      language,
    });
  }, []);

  const stopListening = useCallback(() => {
    voiceRecognition.stop();
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported: voiceRecognition.isAvailable(),
    startListening,
    stopListening,
    clearTranscript,
  };
}
