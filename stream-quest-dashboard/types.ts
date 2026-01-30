export type Provider = 'gemini-live-websocket' | 'gemini-flash-rest';
export type VadSensitivity = 'high' | 'low' | 'default';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface Persona {
    id: string;
    name: string;
    emoji: string;
    description: string;
}

export interface AppConfig {
    // Model & Connection
    provider: Provider;
    apiKey: string;
    modelId: string;

    // Feature Toggles
    proactiveAudio: boolean;
    inputTranscription: boolean;
    outputTranscription: boolean;
    googleGrounding: boolean;
    affectiveDialog: boolean;

    // VAD
    endSpeechSensitivity: VadSensitivity;
    startSpeechSensitivity: VadSensitivity;

    // Persona
    selectedPersonaId: string;
    systemInstructions: string;
    voice: string;

    // Audio Engine
    temperature: number;
    silenceDuration: number;

    // Client VAD
    clientVAD: boolean;
    prefixPadding: number;

    // Custom Capabilities
    alertBox: boolean;
    cssStyle: boolean;
}


export interface Message {
    id: string;
    sender: string;
    text: string;
    type: 'user' | 'assistant' | 'system' | 'user-transcript';
    timestamp: Date;
    isMod?: boolean;
    isFinished?: boolean;
}

export interface MediaConfig {
    microphoneId: string;
    cameraId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
    volume: number;
}
