// AlternativeAudioPlayer.tsx
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Play, Square, Signal, List } from 'lucide-react';

interface AudioPlayerProps {
  serverUrl?: string;
}

const AlternativeAudioPlayer: React.FC<AudioPlayerProps> = ({ serverUrl }) => {
  const { isConnected, isPlaying, queueLength, handlePlay, stopAudio } = useAudioPlayer({ 
    serverUrl,
    onStop: () => {
      console.log('Audio playback stopped');
    }
  });

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Signal className={isConnected ? "text-green-500" : "text-red-500"} size={20} />
          <span className="text-sm font-medium">
            {isConnected ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <List size={20} className="text-gray-500" />
          <span className="text-sm font-medium">{queueLength}</span>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
        >
          <Play className="text-white" size={24} />
        </button>

        <button
          onClick={stopAudio}
          disabled={!isPlaying}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          <Square className="text-white" size={24} />
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {isPlaying ? "Now Playing" : "Ready to Play"}
        </p>
      </div>
    </div>
  );
};

export default AlternativeAudioPlayer;