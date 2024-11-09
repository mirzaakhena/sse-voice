// VoiceRecognition.tsx
import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface VoiceRecognitionProps {
  onTextChange?: (text: string) => void;
  silenceThreshold?: number;
  maxNoSpeechErrors?: number;
  restartDelay?: number;
}

const NewVoiceRecognition: React.FC<VoiceRecognitionProps> = (props) => {
  const {
    isListening,
    currentTranscript,
    startListening,
    stopListening
  } = useVoiceRecognition(props);

  return (
    <div style={{ 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    }}>
      <button 
        onClick={isListening ? stopListening : startListening}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isListening ? '#ff4444' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {isListening ? 'Berhenti Mendengarkan' : 'Mulai Mendengarkan'}
      </button>
      <div style={{
        fontSize: '14px',
        color: isListening ? '#4CAF50' : '#666'
      }}>
        {isListening ? 'Mendengarkan...' : 'Klik untuk mulai'}
      </div>
      {currentTranscript && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          maxWidth: '80%',
          wordWrap: 'break-word'
        }}>
          {currentTranscript}
        </div>
      )}
    </div>
  );
};

export default NewVoiceRecognition;