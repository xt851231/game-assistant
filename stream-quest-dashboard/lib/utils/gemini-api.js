/**
 * Gemini Live API Utilities using @google/genai SDK
 */
import { GoogleGenAI } from "@google/genai";

// Response type constants
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

/**
 * Parses response messages from the Gemini Live API
 */
export class MultimodalLiveResponseMessage {
  constructor(data) {
    this.data = "";
    this.type = "";
    this.endOfTurn = false;

    // Use serverContent from the SDK message
    const serverContent = data.serverContent;

    if (!serverContent && data.toolCall) {
      // Tool call might be at top level or inside content?
      // Based on snippet, structure is message.serverContent...
      // But let's handle if it is different.
    }

    this.endOfTurn = serverContent?.turnComplete;

    try {
      if (data.setupComplete) { // Might be different in SDK
        this.type = MultimodalLiveResponseType.SETUP_COMPLETE;
      } else if (serverContent?.turnComplete) {
        this.type = MultimodalLiveResponseType.TURN_COMPLETE;
      } else if (serverContent?.interrupted) {
        this.type = MultimodalLiveResponseType.INTERRUPTED;
      } else if (serverContent?.modelTurn?.parts) {
        // Iterate through parts to find what we have
        const parts = serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.text) {
            this.data = part.text;
            this.type = MultimodalLiveResponseType.TEXT;
          } else if (part.inlineData) {
            this.data = part.inlineData.data;
            this.type = MultimodalLiveResponseType.AUDIO;
          }
        }
      }

      // Handle transcriptions if available in SDK response (checking manual protocol match)
      // The SDK wrapper might emit different events or structure.
      // We'll stick to what the user snippet suggests: parsing message.serverContent

    } catch (e) {
      console.log("⚠️ Error parsing response data: ", data);
    }
  }
}


/**
 * Function call definition for tool use
 */
export class FunctionCallDefinition {
  constructor(name, description, parameters, requiredParameters) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.requiredParameters = requiredParameters;
  }

  functionToCall(parameters) {
    console.log("▶️Default function call");
  }

  getDefinition() {
    const definition = {
      name: this.name,
      description: this.description,
      parameters: { required: this.requiredParameters, ...this.parameters },
    };
    console.log("created FunctionDefinition: ", definition);
    return definition;
  }

  runFunction(parameters) {
    console.log(
      `⚡ Running ${this.name} function with parameters: ${JSON.stringify(
        parameters
      )}`
    );
    this.functionToCall(parameters);
  }
}

/**
 * Main Gemini Live API client
 */
export class GeminiLiveAPI {
  constructor(proxyUrl, projectId, model) {
    // proxyUrl and projectId are less relevant for direct connection but kept for compatibility
    this.model = model || "gemini-2.0-flash-exp";
    this.apiKey = null;
    this.client = null;
    this.session = null;
    this.connected = false;

    // Config defaults
    this.systemInstructions = "You are a helpful assistant.";
    this.voiceName = "Puck";
    this.responseModalities = ["AUDIO"];
    this.tools = null;

    // Callbacks
    this.onReceiveResponse = (message) => console.log("Default receive", message);
    this.onConnectionStarted = () => console.log("Default connected");
    this.onClose = () => console.log("Default closed");
    this.onErrorMessage = (msg) => console.error(msg);
  }

  async connect() {
    if (!this.apiKey) {
      this.onErrorMessage("API Key is required for direct connection");
      return false;
    }

    try {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });

      const config = {
        model: this.model,
        responseModalities: this.responseModalities,
        systemInstruction: this.systemInstructions,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: this.voiceName
            }
          }
        },
        // Enable transcriptions as per official docs
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      // Add tools if configured
      if (this.tools) {
        config.tools = this.tools;
      }

      // Connect to Gemini Live API
      this.session = await this.client.live.connect({
        model: this.model,
        config: config,
        callbacks: {
          onopen: () => {
            this.connected = true;
            this.onConnectionStarted();
          },
          onmessage: (message) => {
            this.handleIncomingMessage(message);
          },
          onclose: (e) => {
            this.connected = false;
            this.onClose(e);
          },
          onerror: (e) => {
            this.onErrorMessage(e.message);
          }
        }
      });
      return true;

    } catch (error) {
      this.onErrorMessage(error.message);
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
    }
    // Don't call this.onClose() here - it will be called by the WebSocket's onclose event
    // Calling it here creates a circular reference with LiveAPIDemo's disconnect
  }

  enableTranscriptions() {
    // Try to enable transcriptions by sending a config update via WebSocket
    if (!this.session) return;

    const ws = this.session.conn?._ws || this.session.conn?.ws || this.session.conn?.websocket || this.session.conn;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        // Send configuration update to enable transcriptions
        const setupUpdate = {
          setup: {
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          }
        };

        ws.send(JSON.stringify(setupUpdate));
        console.log("✅ Transcription config sent");
      } catch (error) {
        console.error("Failed to enable transcriptions:", error);
      }
    } else {
      console.warn("WebSocket not available for transcription config");
    }
  }

  handleIncomingMessage(message) {
    // Debug: log the full message to understand structure
    console.log("📨 Received message:", JSON.stringify(message, null, 2));

    const serverContent = message.serverContent;

    // Handle setup complete
    if (message.setupComplete) {
      this.onReceiveResponse({ type: MultimodalLiveResponseType.SETUP_COMPLETE });
    }

    // Handle tool calls
    if (message.toolCall) {
      console.log("🛠️ [DEBUG] Tool Call received:", message.toolCall);
      this.onReceiveResponse({
        type: MultimodalLiveResponseType.TOOL_CALL,
        data: message.toolCall
      });
    }

    if (serverContent) {
      if (serverContent.groundingMetadata) {
        console.log("🌍 [DEBUG] Grounding Metadata:", serverContent.groundingMetadata);
      }

      // Handle interruption
      if (serverContent.interrupted) {
        this.onReceiveResponse({ type: MultimodalLiveResponseType.INTERRUPTED });
      }

      // Handle turn complete
      if (serverContent.turnComplete) {
        this.onReceiveResponse({ type: MultimodalLiveResponseType.TURN_COMPLETE, endOfTurn: true });
      }

      // Handle input transcription
      if (serverContent.inputTranscription) {
        const text = serverContent.inputTranscription.text;
        if (text) {
          this.onReceiveResponse({
            type: MultimodalLiveResponseType.INPUT_TRANSCRIPTION,
            data: {
              text: text,
              finished: serverContent.inputTranscription.finished || false
            }
          });
        }
      }

      // Handle output transcription (model's audio response as text)
      if (serverContent.outputTranscription) {
        const text = serverContent.outputTranscription.text;
        if (text) {
          this.onReceiveResponse({
            type: MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION,
            data: { text: text, finished: serverContent.turnComplete || false }
          });
        }
      }

      // Handle model parts (Text, Audio, etc.)
      if (serverContent.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          // Check for thought field (might be part.thought or inside text with thinking tags)
          if (part.thought) {
            console.log("🤔 Model thought (filtered):", part.thought);
            continue; // Skip thoughts
          }

          if (part.text) {
            // Check if text contains thinking tags or thought markers
            if (part.text.includes('<thinking>') || part.text.includes('My thought is')) {
              console.log("🤔 Text contains thought (filtered):", part.text);
              continue; // Skip
            }

            this.onReceiveResponse({
              type: MultimodalLiveResponseType.TEXT,
              data: part.text,
              endOfTurn: serverContent.turnComplete
            });
          } else if (part.inlineData) {
            this.onReceiveResponse({
              type: MultimodalLiveResponseType.AUDIO,
              data: part.inlineData.data,
              endOfTurn: serverContent.turnComplete
            });
          }
        }
      }
    }
  }

  async sendAudioMessage(base64PCM) {
    if (!this.session) return;

    this.session.sendRealtimeInput({
      audio: {
        data: base64PCM,
        mimeType: "audio/pcm;rate=16000"
      }
    });
  }

  async sendImageMessage(base64Image, mimeType = "image/jpeg") {
    if (!this.session) return;

    // The @google/genai SDK's sendRealtimeInput doesn't properly support images
    // Try to access the underlying WebSocket for direct protocol support

    // Check if session exposes WebSocket (common property names)
    // Based on console logs, session has 'conn' property
    let ws = null;

    if (this.session.conn) {
      ws = this.session.conn._ws || this.session.conn.ws || this.session.conn.websocket || this.session.conn;
      // Check if conn itself is the WebSocket
      if (ws && typeof ws.send !== 'function') {
        ws = null;
      }
    }

    // Fallback to direct session properties
    if (!ws) {
      ws = this.session._ws || this.session.ws || this.session.websocket;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send using raw WebSocket with correct Gemini protocol
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
        console.log("📷 Image sent via direct WebSocket access");
        return;
      } catch (error) {
        console.error("Failed to send via WebSocket:", error);
      }
    } else {
      // Debug: log session structure to understand what's available
      console.log("Session keys:", Object.keys(this.session));
      if (this.session.conn) {
        console.log("Session.conn keys:", Object.keys(this.session.conn));
      }
      console.log("No WebSocket found on session, trying SDK method...");

      // Fallback to SDK method (likely won't work for images)
      try {
        this.session.sendRealtimeInput({
          mediaChunks: [{
            mimeType: mimeType,
            data: base64Image
          }]
        });
        console.log("📷 Image sent via SDK (may not work)");
      } catch (error) {
        console.error("Failed to send image via SDK:", error);
      }
    }
  }

  sendTextMessage(text, imageBase64 = null) {
    if (!this.session) return;

    // Construct parts
    const parts = [{ text: text }];

    // Add image if provided
    if (imageBase64) {
      // Prepend image to give context before text
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    // Use SDK's sendClientContent method with explicit content structure
    this.session.sendClientContent({
      turns: [{
        role: "user",
        parts: parts
      }],
      turnComplete: true
    });
  }

  // Setters
  setSystemInstructions(inst) { this.systemInstructions = inst; }
  setVoice(voice) { this.voiceName = voice; }
  setTools(tools) { this.tools = tools; }
  // ... other setters won't dynamically update session once connected in this simple version
  // unless SDK supports updateSession (which it likely does via send setup message)
  // For now we assume config is set before connect.
}