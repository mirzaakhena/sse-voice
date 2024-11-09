# Voice-Controlled Audio Player

A React component library featuring a voice-controlled audio player with server-sent events (SSE) for streaming audio content. The system includes voice recognition capabilities for hands-free control and a robust audio queue management system.

## Features

- 🎤 Voice command recognition
- 🔊 Audio streaming via SSE
- ⏯️ Queue-based audio playback
- 🗣️ Real-time voice transcription
- 🔄 Auto-reconnection handling
- 🎯 Customizable voice commands
- 📱 Responsive UI with Tailwind CSS

## Quick Start

### Frontend Setup

```tsx
import { VoiceControlledPlayer } from 'voice-controlled-player';

function App() {
  return (
    <VoiceControlledPlayer 
      serverUrl="http://localhost:8080"
      onPlaybackStop={() => console.log('Playback stopped')}
    />
  );
}
```

### Backend Setup (Go)

1. Create a directory for audio files:
```bash
mkdir sounds
```

2. Place your MP3 files in the `sounds` directory (numbered from 01.mp3 to 06.mp3)

3. Run the server:
```bash
go run main.go
```

## Components and Hooks

### VoiceControlledPlayer

Main component that integrates voice recognition with audio playback.

```tsx
interface VoiceControlledPlayerProps {
  serverUrl?: string;              // Audio streaming server URL
  onPlaybackStop?: () => void;     // Callback when audio stops
  className?: string;              // Additional CSS classes
}
```

### useAudioPlayer Hook

Manages audio playback and queue state.

```tsx
const {
  isConnected,    // SSE connection status
  isPlaying,      // Current playback status
  queueLength,    // Number of audio files in queue
  handlePlay,     // Start playback function
  stopAudio       // Stop playback function
} = useAudioPlayer({
  serverUrl?: string,
  onStop?: () => void
});
```

### useVoiceRecognition Hook

Handles voice recognition and command processing.

```tsx
const {
  isListening,        // Voice recognition status
  currentTranscript,  // Real-time transcript
  startListening,     // Start recognition function
  stopListening      // Stop recognition function
} = useVoiceRecognition({
  onTextChange?: (text: string) => void,
  silenceThreshold?: number,
  maxNoSpeechErrors?: number,
  restartDelay?: number
});
```

## Voice Commands

Currently, the system responds to the following voice command:
- `"adam stop"`: Stops the current audio playback

## Server API Endpoints

### SSE Endpoint
- **URL**: `/sse`
- **Method**: `GET`
- **Events**:
  - `connected`: Initial connection confirmation
  - `heartbeat`: Keep-alive ping (every 15 seconds)
  - `audio`: Audio data in base64 format

### Playback Control
- **URL**: `/play`
- **Method**: `POST`
- **Description**: Initiates sequential playback of audio files

## Configuration Options

### Voice Recognition
```typescript
{
  silenceThreshold: 500,        // Silence detection threshold (ms)
  maxNoSpeechErrors: 3,         // Max consecutive no-speech errors
  restartDelay: 1000,           // Delay before restarting recognition (ms)
  lang: 'id-ID'                 // Recognition language
}
```

### Audio Player
```typescript
{
  serverUrl: 'http://localhost:8080',  // Default server URL
  autoReconnect: true,                 // Auto reconnect on connection loss
  queueBufferSize: 10                  // Maximum queue size
}
```

## Error Handling

The system includes robust error handling for:
- Voice recognition failures
- Network connectivity issues
- Audio playback errors
- Server connection problems

## Requirements

### Frontend
- React 16.8+
- Modern browser with Web Speech API support
- Tailwind CSS

### Backend
- Go 1.16+
- Audio files in MP3 format

## Browser Support

- Chrome 33+
- Edge 79+
- Safari 14.1+
- Firefox 85+

## License

MIT License - see LICENSE for details