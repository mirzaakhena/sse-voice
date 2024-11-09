interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  abort(): void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// useVoiceRecognition.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceRecognitionProps {
  onTextChange?: (text: string) => void;
  silenceThreshold?: number;
  maxNoSpeechErrors?: number;
  restartDelay?: number;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  currentTranscript: string;
  startListening: () => void;
  stopListening: () => void;
}

export const useVoiceRecognition = ({
  onTextChange,
  silenceThreshold = 1500,
  maxNoSpeechErrors = 3,
  restartDelay = 1000
}: UseVoiceRecognitionProps): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<number | null>(null);
  const previousResultLength = useRef<number>(0);
  const currentTranscriptRef = useRef(currentTranscript);
  const isRestartingRef = useRef(false);
  const handlersRef = useRef<((recognition: SpeechRecognition) => void) | null>(null);
  const shouldContinueRef = useRef(false);
  const noSpeechErrorCount = useRef(0);
  const lastResultTimestamp = useRef(Date.now());

  useEffect(() => {
    currentTranscriptRef.current = currentTranscript;
  }, [currentTranscript]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const handleTranscriptComplete = useCallback((finalTranscript: string) => {
    if (finalTranscript.trim()) {
      onTextChange?.(finalTranscript);
      setCurrentTranscript('');
      previousResultLength.current = 0;
      noSpeechErrorCount.current = 0;
    }
  }, [onTextChange]);

  const createRecognitionInstance = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'id-ID';

    return recognitionInstance;
  }, []);

  const shouldRestartAfterError = useCallback((error: string) => {
    if (error === 'no-speech') {
      noSpeechErrorCount.current++;
      
      if (noSpeechErrorCount.current >= maxNoSpeechErrors) {
        console.log(`Berhenti karena ${maxNoSpeechErrors} error no-speech berturut-turut`);
        return false;
      }

      const timeSinceLastResult = Date.now() - lastResultTimestamp.current;
      if (timeSinceLastResult < silenceThreshold) {
        return true;
      }
    }
    
    return shouldContinueRef.current;
  }, [maxNoSpeechErrors, silenceThreshold]);

  const safeRestartRecognition = useCallback(() => {
    if (isRestartingRef.current || !shouldContinueRef.current) return;
    
    isRestartingRef.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {};
      recognitionRef.current.stop();
    }
    
    setTimeout(() => {
      if (shouldContinueRef.current) {
        try {
          const newRecognition = createRecognitionInstance();
          if (newRecognition && handlersRef.current) {
            handlersRef.current(newRecognition);
            recognitionRef.current = newRecognition;
            newRecognition.start();
          }
        } catch (error) {
          console.error('Error restarting recognition:', error);
          shouldContinueRef.current = false;
          setIsListening(false);
        }
      }
      isRestartingRef.current = false;
    }, restartDelay);
  }, [createRecognitionInstance, restartDelay]);

  const setupRecognitionHandlers = useCallback((recognition: SpeechRecognition) => {
    recognition.onstart = () => {
      console.log('Pengenalan suara dimulai');
      setIsListening(true);
      if (!currentTranscriptRef.current) {
        setCurrentTranscript('');
        previousResultLength.current = 0;
      }
    };

    recognition.onend = () => {
      console.log('Pengenalan suara selesai');
      if (!isRestartingRef.current) {
        shouldContinueRef.current = false;
        setIsListening(false);
        clearSilenceTimer();
        const finalTranscript = currentTranscriptRef.current;
        if (finalTranscript.trim()) {
          handleTranscriptComplete(finalTranscript);
        }
      } else if (shouldContinueRef.current) {
        safeRestartRecognition();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimer();
      lastResultTimestamp.current = Date.now();
      noSpeechErrorCount.current = 0;

      const results = Array.from(event.results);
      const transcript = results[results.length - 1][0].transcript;

      setCurrentTranscript(transcript);

      const currentLength = results.length;
      if (currentLength > previousResultLength.current) {
        previousResultLength.current = currentLength;
      }

      silenceTimer.current = window.setTimeout(() => {
        if (transcript.trim()) {
          handleTranscriptComplete(transcript);
          safeRestartRecognition();
        }
      }, silenceThreshold);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Kesalahan pengenalan suara:', event.error);
      
      if (shouldRestartAfterError(event.error)) {
        safeRestartRecognition();
      } else {
        shouldContinueRef.current = false;
        setIsListening(false);
        clearSilenceTimer();
      }
    };
  }, [clearSilenceTimer, handleTranscriptComplete, silenceThreshold, safeRestartRecognition, shouldRestartAfterError]);

  useEffect(() => {
    handlersRef.current = setupRecognitionHandlers;
  }, [setupRecognitionHandlers]);

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (!isListening && !isRestartingRef.current) {
      shouldContinueRef.current = true;
      try {
        const newRecognition = createRecognitionInstance();
        if (newRecognition && handlersRef.current) {
          handlersRef.current(newRecognition);
          recognitionRef.current = newRecognition;
          newRecognition.start();
        }
      } catch (error) {
        console.error('Error starting recognition:', error);
        shouldContinueRef.current = false;
      }
    } else {
      console.error('Pengenalan suara sedang dalam proses atau sedang restart');
    }
  }, [isListening, createRecognitionInstance]);

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;
    if (recognitionRef.current && !isRestartingRef.current) {
      recognitionRef.current.stop();
      clearSilenceTimer();
    }
  }, [clearSilenceTimer]);

  return {
    isListening,
    currentTranscript,
    startListening,
    stopListening
  };
};