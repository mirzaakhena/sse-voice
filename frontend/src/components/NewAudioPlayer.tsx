// AudioPlayer.tsx
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface AudioPlayerProps {
  serverUrl?: string;
}

const NewAudioPlayer: React.FC<AudioPlayerProps> = ({ serverUrl }) => {
  const { isConnected, isPlaying, queueLength, handlePlay } = useAudioPlayer({ serverUrl });

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-sm text-gray-600">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div className="text-sm text-gray-600">
        Queue Length: {queueLength}
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

export default NewAudioPlayer;