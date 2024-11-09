import { useState, useRef, useEffect } from 'react';

interface QueuedAudio {
  url: string;
  blob: Blob;
}

interface UseAudioPlayerProps {
  serverUrl?: string;
  onStop?: () => void;
}

interface AudioPlayerState {
  isConnected: boolean;
  isPlaying: boolean;
  queueLength: number;
}

export const useAudioPlayer = ({ 
  serverUrl = 'http://localhost:8080',
  onStop 
}: UseAudioPlayerProps) => {
  const [state, setState] = useState<AudioPlayerState>({
    isConnected: false,
    isPlaying: false,
    queueLength: 0
  });
  
  const audioElement = useRef(new Audio());
  const audioQueue = useRef<QueuedAudio[]>([]);
  const isProcessingQueue = useRef(false);
  const shouldStop = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanupCurrentAudio = () => {
    audioElement.current.pause();
    audioElement.current.currentTime = 0;
    
    if (audioQueue.current.length > 0) {
      URL.revokeObjectURL(audioQueue.current[0].url);
    }
  };

  const stopAudio = () => {
    shouldStop.current = true;
    cleanupCurrentAudio();
    
    audioQueue.current.forEach(audio => URL.revokeObjectURL(audio.url));
    audioQueue.current = [];
    
    setState(prev => ({ 
      ...prev, 
      isPlaying: false,
      queueLength: 0
    }));

    isProcessingQueue.current = false;
    onStop?.();
  };

  const processQueue = async () => {
    if (isProcessingQueue.current || audioQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    shouldStop.current = false;
    setState(prev => ({ ...prev, isPlaying: true }));

    while (audioQueue.current.length > 0 && !shouldStop.current) {
      const nextAudio = audioQueue.current[0];
      audioElement.current.src = nextAudio.url;
      
      try {
        await audioElement.current.play();
        await new Promise((resolve, reject) => {
          audioElement.current.onended = resolve;
          audioElement.current.onerror = reject;
        });
        
        URL.revokeObjectURL(nextAudio.url);
        audioQueue.current.shift();
        setState(prev => ({ 
          ...prev, 
          queueLength: audioQueue.current.length 
        }));
      } catch (error) {
        console.error('Error playing audio:', error);
        audioQueue.current.shift();
        setState(prev => ({ 
          ...prev, 
          queueLength: audioQueue.current.length 
        }));
      }

      if (shouldStop.current) break;
    }

    isProcessingQueue.current = false;
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const base64ToBlob = (base64: string, type: string = 'audio/mp3'): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  const handlePlay = async () => {
    try {
      const response = await fetch(`${serverUrl}/play`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start audio playback');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setState(prev => ({ ...prev, isConnected: false }));
    }
  };

  useEffect(() => {
    const setupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`${serverUrl}/sse`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection established');
      };

      eventSource.addEventListener('connected', () => {
        setState(prev => ({ ...prev, isConnected: true }));
        console.log('Connected to SSE server');
      });

      eventSource.addEventListener('heartbeat', () => {
        setState(prev => ({ ...prev, isConnected: true }));
      });

      eventSource.addEventListener('audio', (event) => {
        const base64Audio = event.data;
        const blob = base64ToBlob(base64Audio);
        const url = URL.createObjectURL(blob);
        
        audioQueue.current.push({ url, blob });
        setState(prev => ({ 
          ...prev, 
          queueLength: audioQueue.current.length 
        }));
        
        processQueue();
      });

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect after 5 seconds
        setTimeout(setupEventSource, 5000);
      };
    };

    setupEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setState(prev => ({ ...prev, isConnected: false }));
      cleanupCurrentAudio();
      audioQueue.current.forEach(audio => URL.revokeObjectURL(audio.url));
      audioQueue.current = [];
    };
  }, [serverUrl]);

  return {
    ...state,
    handlePlay,
    stopAudio
  };
};