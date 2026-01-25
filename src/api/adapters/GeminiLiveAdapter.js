/**
 * Gemini Live Adapter
 * Implements ModelAdapter interface for Google Gemini Live API (WebSocket)
 */
import { ModelAdapter } from '../interfaces/ModelAdapter';
import { GoogleGenAI } from "@google/genai";

// Response type constants (Internal to this adapter)
export const MultimodalLiveResponseType = {
    TEXT: "TEXT",
    AUDIO: "AUDIO",
    SETUP_COMPLETE: "SETUP COMPLETE",
    INTERRUPTED: "INTERRUPTED",
    TURN_COMPLETE: "TURN COMPLETE",
    TOOL_CALL: "TOOL_CALL",
    ERROR: "ERROR",
    INPUT_TRANSCRIPTION: "INPUT_TRANSCRIPTION",
    OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",
};

export class GeminiLiveAdapter extends ModelAdapter {
    constructor(config) {
        super(config);
        this.client = null;
        this.session = null;
        this.model = config.modelId || "gemini-2.5-flash-native-audio-preview-12-2025";
        this.responseModalities = ["AUDIO"]; // Default to Audio for Live
        this.tools = null;
    }

    async connect(config) {
        // Update config if provided
        if (config) {
            this.config = { ...this.config, ...config };
            if (config.modelId) this.model = config.modelId;
        }

        if (!this.config.apiKey) {
            this.emit('error', "API Key is required");
            return false;
        }

        try {
            this.client = new GoogleGenAI({ apiKey: this.config.apiKey });

            const connectConfig = {
                model: this.model,
                responseModalities: this.responseModalities,
                systemInstruction: this.config.systemInstruction || "You are a helpful assistant.",
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: this.config.voice || "Puck"
                        }
                    }
                },
                // Disable thoughts in response output
                thinkingConfig: {
                    includeThoughts: false
                },
                // Enable transcriptions
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            };

            if (this.tools) {
                connectConfig.tools = this.tools;
            }

            this.session = await this.client.live.connect({
                model: this.model,
                config: connectConfig,
                callbacks: {
                    onopen: () => {
                        this.connected = true;
                        this.emit('open');
                    },
                    onmessage: (message) => this.handleIncomingMessage(message),
                    onclose: (e) => {
                        this.connected = false;
                        this.emit('close', e);
                    },
                    onerror: (e) => this.emit('error', e.message)
                }
            });

            return true;
        } catch (error) {
            this.emit('error', error.message);
            this.connected = false;
            return false;
        }
    }

    disconnect() {
        if (this.session) {
            this.connected = false;
            // Try to close the WebSocket properly
            const ws = this.session.conn?._ws || this.session.conn?.ws || this.session.conn?.websocket || this.session.conn;
            if (ws && typeof ws.close === 'function') {
                try {
                    ws.close();
                } catch (error) {
                    console.error("Error closing WebSocket:", error);
                }
            }
            this.session = null;
            this.emit('close');
        }
    }

    async sendAudio(base64PCM) {
        if (!this.session) return;
        this.session.sendRealtimeInput({
            audio: {
                data: base64PCM,
                mimeType: "audio/pcm;rate=16000"
            }
        });
    }

    async sendImage(base64Image, mimeType = "image/jpeg") {
        if (!this.session) return;

        // Try to access the underlying WebSocket for direct protocol support
        // (Copied from original implementation as SDK might have issues with images)
        let ws = null;
        if (this.session.conn) {
            ws = this.session.conn._ws || this.session.conn.ws || this.session.conn.websocket || this.session.conn;
            if (ws && typeof ws.send !== 'function') ws = null;
        }
        if (!ws) ws = this.session._ws || this.session.ws || this.session.websocket;

        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = {
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: mimeType,
                        data: base64Image
                    }]
                }
            };
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error("Failed to send via WebSocket:", error);
            }
        } else {
            // Fallback to SDK
            try {
                this.session.sendRealtimeInput({
                    mediaChunks: [{
                        mimeType: mimeType,
                        data: base64Image
                    }]
                });
            } catch (error) {
                console.error("Failed to send image via SDK:", error);
            }
        }
    }

    sendText(text, imageBase64 = null) {
        if (!this.session) return;

        const parts = [{ text: text }];
        if (imageBase64) {
            parts.unshift({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64
                }
            });
        }

        this.session.sendClientContent({
            turns: [{
                role: "user",
                parts: parts
            }],
            turnComplete: true
        });
    }

    setTools(tools) {
        this.tools = tools;
    }

    handleIncomingMessage(message) {
        const serverContent = message.serverContent;

        if (message.setupComplete) {
            this.emit('content', { type: 'setup_complete' });
        }

        if (message.toolCall) {
            this.emit('content', {
                type: 'tool_call',
                data: message.toolCall
            });
        }

        if (serverContent) {
            if (serverContent.interrupted) {
                this.emit('content', { type: 'interrupted' });
            }

            if (serverContent.turnComplete) {
                this.emit('content', { type: 'turn_complete' });
            }

            if (serverContent.inputTranscription) {
                this.emit('content', {
                    type: 'input_transcription',
                    data: serverContent.inputTranscription
                });
            }

            if (serverContent.outputTranscription) {
                this.emit('content', {
                    type: 'output_transcription',
                    data: serverContent.outputTranscription
                });
            }

            if (serverContent.modelTurn?.parts) {
                for (const part of serverContent.modelTurn.parts) {
                    // Skip thought parts - the SDK returns thoughts in a separate 'thought' property
                    if (part.thought) {
                        continue;
                    }

                    if (part.text) {
                        this.emit('content', {
                            type: 'text',
                            data: part.text,
                            endOfTurn: serverContent.turnComplete
                        });
                    } else if (part.inlineData) {
                        this.emit('content', {
                            type: 'audio',
                            data: part.inlineData.data,
                            endOfTurn: serverContent.turnComplete
                        });
                    }
                }
            }
        }
    }
}
