import { AppConfig, MediaConfig, Persona } from './types';

export const DEFAULT_CONFIG: AppConfig = {
    provider: 'gemini-live-websocket',
    apiKey: '',
    modelId: 'gemini-2.5-flash-native-audio-preview-12-2025',
    proactiveAudio: false,
    inputTranscription: true,
    outputTranscription: true,
    googleGrounding: false,
    affectiveDialog: true,
    endSpeechSensitivity: 'default',
    startSpeechSensitivity: 'default',
    selectedPersonaId: 'felix',
    systemInstructions: 'You are a helpful retro gaming assistant.',
    voice: 'Puck',
    temperature: 0.7,
    silenceDuration: 500,
    clientVAD: true,
    prefixPadding: 300,
    alertBox: true,
    cssStyle: false,
};

export const DEFAULT_MEDIA_CONFIG: MediaConfig = {
    microphoneId: 'default',
    cameraId: 'default',
    audioEnabled: true,
    videoEnabled: true,
    screenShareEnabled: false,
    volume: 80,
};

export const PERSONAS: Persona[] = [
    { id: 'felix', name: 'Felix', emoji: '🧙‍♂️', description: 'Wise Sage' },
    { id: 'luna', name: 'Luna', emoji: '🧝‍♀️', description: 'Mystic Elf' },
    { id: 'kai', name: 'Kai', emoji: '🤖', description: 'Cyber Rogue' },
    { id: 'pixel', name: 'Pixel', emoji: '👾', description: '8-bit Mascot' },
];

export const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const INITIAL_MESSAGES = [];
