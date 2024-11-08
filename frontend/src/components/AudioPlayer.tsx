import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  serverUrl?: string;
}

interface QueuedAudio {
  url: string;
  blob: Blob;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ serverUrl = 'http://localhost:8080' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(new Audio());
  const audioQueue = useRef<QueuedAudio[]>([]);
  const isProcessingQueue = useRef(false);

  const processQueue = async () => {
    if (isProcessingQueue.current || audioQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    setIsPlaying(true);

    while (audioQueue.current.length > 0) {
      const nextAudio = audioQueue.current[0];
      audioElement.current.src = nextAudio.url;
      
      try {
        await audioElement.current.play();
        await new Promise(resolve => {
          audioElement.current.onended = () => {
            // Cleanup the URL and remove the played audio from queue
            URL.revokeObjectURL(nextAudio.url);
            audioQueue.current.shift();
            resolve(null);
          };
        });
      } catch (error) {
        console.error('Error playing audio:', error);
        // Remove failed audio and continue with next
        audioQueue.current.shift();
      }
    }

    isProcessingQueue.current = false;
    setIsPlaying(false);
  };

  useEffect(() => {
    const eventSource = new EventSource(`${serverUrl}/sse`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connection established');
    };

    eventSource.addEventListener('audio', (event) => {
      const base64Audio = event.data;
      const blob = base64ToBlob(base64Audio, 'audio/mp3');
      const url = URL.createObjectURL(blob);
      
      // Add to queue
      audioQueue.current.push({ url, blob });
      
      // Start processing queue if not already processing
      processQueue();
    });

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
      // Cleanup any remaining audio URLs
      audioQueue.current.forEach(audio => URL.revokeObjectURL(audio.url));
      audioQueue.current = [];
    };
  }, [serverUrl]);

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
    }
  };

  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-sm text-gray-600">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div className="text-sm text-gray-600">
        Queue Length: {audioQueue.current.length}
      </div>
      <div className="text-sm text-gray-600">
        {isPlaying ? 'Playing...' : 'Idle'}
      </div>
      <button
        onClick={handlePlay}
        disabled={isPlaying}
        className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
          ${isPlaying 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        Play Audio Sequence
      </button>
    </div>
  );
};

export default AudioPlayer;