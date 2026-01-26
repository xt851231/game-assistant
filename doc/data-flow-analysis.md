# Data Flow Analysis: Image, Voice, and Chat Process

This document outlines the data schemas and workflow for components in the Gaming Assistant Demo App, specifically focusing on the interface between the React UI and the Gemini Live API.

## Overview

The application utilizes the Gemini Live API (Multimodal WebSockets) to handle real-time audio, video, and text interactions. The data flow is mediated by the `GeminiLiveAPI` utility class, which wraps the `@google/genai` SDK.

---

## 1. Input Schemas (Client → Gemini)

These schemas represent how the UI sends user data to the Gemini model.

### A. Voice Process (Audio)
Audio is captured from the microphone, converted to 16-bit PCM at 16,000Hz, and sent as base64-encoded chunks.

- **Data Format:** PCM16, Mono, 16000Hz, Base64.
- **Protocol Message:**
```json
{
  "realtimeInput": {
    "audio": {
      "data": "<BASE64_PCM_DATA>",
      "mimeType": "audio/pcm;rate=16000"
    }
  }
}
```

### B. Image Process (Camera/Screen)
Frames are captured at a regular interval (default 1 FPS) or on-demand when a text message is sent.

- **Data Format:** JPEG, Base64.
- **Protocol Message:**
```json
{
  "realtimeInput": {
    "mediaChunks": [
      {
        "mimeType": "image/jpeg",
        "data": "<BASE64_IMAGE_DATA>"
      }
    ]
  }
}
```

### C. Chat Process (Text + Metadata)
Text messages can be sent alone or with an attached image snapshot (if optimization is enabled).

- **Protocol Message:**
```json
{
  "clientContent": {
    "turns": [
      {
        "role": "user",
        "parts": [
          { "inlineData": { "mimeType": "image/jpeg", "data": "<BASE64_SNAPSHOT>" } },
          { "text": "user message text" }
        ]
      }
    ],
    "turnComplete": true
  }
}
```

---

## 2. Output Schemas (Gemini → Client)

These schemas represent how the model responds to the UI.

### A. Text Response
The model's textual reply, often accompanied by thinking or metadata.

- **Protocol Message:**
```json
{
  "serverContent": {
    "modelTurn": {
      "parts": [
        { "text": "Assistant's response text" }
      ]
    },
    "turnComplete": true
  }
}
```

### B. Audio Response
Model speech sent as base64-encoded PCM chunks.

- **Data Format:** PCM16, Mono, 24000Hz, Base64.
- **Protocol Message:**
```json
{
  "serverContent": {
    "modelTurn": {
      "parts": [
        { 
          "inlineData": { 
            "data": "<BASE64_PCM_AUDIO>", 
            "mimeType": "audio/pcm;rate=24000" 
          } 
        }
      ]
    }
  }
}
```

### C. Transcriptions
Real-time text representations of both user speech and model speech.

- **Input Transcription (User):**
```json
{
  "serverContent": {
    "inputTranscription": { "text": "...", "finished": true }
  }
}
```
- **Output Transcription (Assistant):**
```json
{
  "serverContent": {
    "outputTranscription": { "text": "..." }
  }
}
```

### D. Tool Calls
When the model triggers a function call.

- **Protocol Message:**
```json
{
  "toolCall": {
    "functionCalls": [
      { 
        "name": "function_name", 
        "args": { "key": "value" }, 
        "id": "call_id" 
      }
    ]
  }
}
```

---

## 3. Data Flow Diagram

```mermaid
graph TD
    subgraph UI_Layer [React UI Components]
        LiveAPIDemo[LiveAPIDemo.jsx]
        AudioStreamer[AudioStreamer]
        VideoStreamer[VideoStreamer / ScreenCapture]
    end

    subgraph Logic_Layer [Utilities / SDK]
        GLA[GeminiLiveAPI.js]
        SDK[@google/genai]
    end

    subgraph Service_Layer [Gemini Live API Server]
        Model[Gemini 2.x Model]
    end

    %% Voice Flow
    AudioStreamer -- "PCM16 16k Base64" --> GLA
    GLA -- "realtimeInput.audio" --> SDK
    SDK -- "WebSocket" --> Model

    %% Image Flow
    VideoStreamer -- "JPEG Base64" --> GLA
    GLA -- "realtimeInput.mediaChunks" --> SDK
    SDK -- "WebSocket" --> Model

    %% Chat Flow
    LiveAPIDemo -- "Text + Snapshot" --> GLA
    GLA -- "clientContent.turns" --> SDK
    SDK -- "WebSocket" --> Model

    %% Model Response Flow
    Model -- "serverContent.modelTurn" --> SDK
    SDK -- "onmessage(parsed)" --> GLA
    GLA -- "onReceiveResponse(callback)" --> LiveAPIDemo
    LiveAPIDemo -- "Play Audio" --> AudioPlayer[AudioPlayer]
    LiveAPIDemo -- "Update Chat" --> ChatUI[Chat UI]
```

---

## 4. Key Format Conversions

| Data Type | UI Internal Format | Wire Format (Base64) | Model Native Info |
|-----------|--------------------|-----------------------|-------------------|
| **Audio In** | Float32Array (Web Audio) | PCM16 (Little Endian) | 16,000 Hz, Mono |
| **Audio Out** | PCM16 (Little Endian) | PCM16 (Little Endian) | 24,000 Hz, Mono |
| **Images** | HTMLCanvas / Blob | JPEG (q=0.7-0.8) | Variable Res |
| **Text** | String | JSON String | UTF-8 |
