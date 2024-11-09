// SimpleAudioPlayer.tsx
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface AudioPlayerProps {
  serverUrl?: string;
}

const SimpleAudioPlayer: React.FC<AudioPlayerProps> = ({ serverUrl }) => {
  const { isConnected, isPlaying, queueLength, handlePlay, stopAudio } = useAudioPlayer({ 
    serverUrl,
    onStop: () => {
      console.log('Audio playback stopped');
    }
  });

  return (
    <div className="max-w-sm mx-auto bg-white shadow-md rounded-lg p-4">
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
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-6 py-2 rounded-md font-medium transition-all
            disabled:bg-gray-100 disabled:text-gray-400
            enabled:bg-blue-50 enabled:text-blue-600 enabled:hover:bg-blue-100"
        >
          Play
        </button>
        <button
          onClick={stopAudio}
          disabled={!isPlaying}
          className="px-6 py-2 rounded-md font-medium transition-all
            disabled:bg-gray-100 disabled:text-gray-400
            enabled:bg-red-50 enabled:text-red-600 enabled:hover:bg-red-100"
        >
          Stop
        </button>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <span className={`text-sm font-medium ${isPlaying ? 'text-blue-600' : 'text-gray-500'}`}>
          {isPlaying ? '▶ Playing...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default SimpleAudioPlayer;