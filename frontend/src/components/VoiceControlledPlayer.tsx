import React, { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Mic } from 'lucide-react';

interface VoiceControlledPlayerProps {
  serverUrl?: string;
  onPlaybackStop?: () => void;
  className?: string;
}

const stopWord = 'stop stopada'

const VoiceControlledPlayer: React.FC<VoiceControlledPlayerProps> = ({
  serverUrl = 'http://localhost:8080',
  onPlaybackStop,
  className = ''
}) => {
  const [lastDetectedVoice, setLastDetectedVoice] = useState<string>('');
  
  const { 
    isConnected, 
    isPlaying, 
    queueLength, 
    handlePlay, 
    stopAudio 
  } = useAudioPlayer({
    serverUrl,
    onStop: onPlaybackStop
  });

  const handleVoiceCommand = useCallback((text: string) => {
    setLastDetectedVoice(text);
    if (text.toLowerCase().trim().includes(stopWord)) {
      stopAudio();
    }
  }, [stopAudio]);

  const {
    isListening,
    currentTranscript,
    startListening,
    stopListening
  } = useVoiceRecognition({
    onTextChange: handleVoiceCommand,
    silenceThreshold: 500
  });

  // Start voice recognition when audio starts playing
  useEffect(() => {
    if (isPlaying && !isListening) {
      startListening();
    } else if (!isListening) {
      stopListening();
      setLastDetectedVoice('');
    }
  }, [isPlaying, isListening, startListening, stopListening]);

  return (
    <div className={`max-w-sm mx-auto bg-white shadow-md rounded-lg p-4 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-gray-600">
          Queue: <span className="font-medium">{queueLength}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying || !isConnected}
          className="px-8 py-2 rounded-md font-medium transition-all
            disabled:bg-gray-100 disabled:text-gray-400
            enabled:bg-blue-50 enabled:text-blue-600 enabled:hover:bg-blue-100"
        >
          Play
        </button>
      </div>

      {/* Voice Detection Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <Mic 
            size={16} 
            className={`transition-colors ${isListening ? 'text-red-500' : 'text-gray-400'}`}
          />
          <span className={`text-sm font-medium ${isListening ? 'text-red-500' : 'text-gray-400'}`}>
            {isListening ? `Listening for "${stopWord}" command...` : 'Voice control inactive'}
          </span>
        </div>
        
        {isListening && (
          <>
            {/* Real-time transcript */}
            {currentTranscript && (
              <div className="text-sm text-gray-600 mb-1">
                Hearing: <span className="italic">{currentTranscript}</span>
              </div>
            )}
            
            {/* Last detected complete phrase */}
            {lastDetectedVoice && (
              <div className="text-sm text-gray-600">
                Last detected: <span className="font-medium">{lastDetectedVoice}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Playback Status */}
      <div className="text-center">
        <span className={`text-sm font-medium ${isPlaying ? 'text-blue-600' : 'text-gray-500'}`}>
          {isPlaying ? '▶ Playing...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default VoiceControlledPlayer;