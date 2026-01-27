import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ModelClient } from "../api/ModelClient";
import {
  AudioStreamer,
  VideoStreamer,
  ScreenCapture,
  AudioPlayer,
} from "../utils/media-utils";
import { ShowAlertTool, AddCSSStyleTool } from "../utils/tools";
import "./LiveAPIDemo.css";

const PERSONAS = [
  {
    name: "Wise Wizard",
    emoji: "🧙‍♂️",
    voice: "Fenrir",
    instructions:
      "You are a wise, ancient wizard gaming assistant. Speak in the wispy but wise voice of an ancient wizzard. Call the user 'Traveler'. Be helpful but mysterious.",
  },
  {
    name: "SciFi Robot",
    emoji: "🤖",
    voice: "Kore",
    instructions:
      "You are a futuristic sci-fi space robot gaming assistant. Speak in a robotic voice.  Call the user 'Captain'. Be precise and analytical.",
  },
  {
    name: "Commander",
    emoji: "🫡",
    voice: "Charon",
    instructions:
      "You are a stern military commander gaming assistant. Speak with authority and brevity. Use military terminology. Call the user 'Soldier'. Demand victory.",
  },
];

const LiveAPIDemo = forwardRef((props, ref) => {
  // Connection State
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [setupJson, setSetupJson] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'config', 'media', 'chat'

  // Configuration State
  const [configTab, setConfigTab] = useState('model'); // 'model', 'behavior'

  // Unused settings hidden but state kept for compatibility
  const [proxyUrl, setProxyUrl] = useState("ws://localhost:8080");
  const [projectId, setProjectId] = useState("");

  const [liveApiKey, setLiveApiKey] = useState(
    localStorage.getItem("liveApiKey") || ""
  );
  const [flashApiKey, setFlashApiKey] = useState(
    localStorage.getItem("flashApiKey") || ""
  );
  // Default to true and hidden
  const [directConnection, setDirectConnection] = useState(true);

  const [model, setModel] = useState(
    localStorage.getItem("model") || "gemini-2.0-flash-exp"
  );
  const [provider, setProvider] = useState(
    localStorage.getItem("provider") || "live"
  );

  useEffect(() => {
    localStorage.setItem("liveApiKey", liveApiKey);
    localStorage.setItem("flashApiKey", flashApiKey);
    // directConnection is always true now, but if we wanted to persist:
    // localStorage.setItem("directConnection", directConnection);
    localStorage.setItem("model", model);
    localStorage.setItem("provider", provider);
  }, [liveApiKey, flashApiKey, model, provider]);
  const [systemInstructions, setSystemInstructions] = useState(
    `You are an energetic gaming assistant.
Be concise and friendly.
Respond helpfully to all user messages.`
  );
  const [voice, setVoice] = useState("Puck");
  const [temperature, setTemperature] = useState(1.0);
  const [enableProactiveAudio, setEnableProactiveAudio] = useState(true);
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [enableAffectiveDialog, setEnableAffectiveDialog] = useState(true);
  const [enableAlertTool, setEnableAlertTool] = useState(false);
  const [enableCssStyleTool, setEnableCssStyleTool] = useState(false);
  const [enableInputTranscription, setEnableInputTranscription] =
    useState(true);
  const [enableOutputTranscription, setEnableOutputTranscription] =
    useState(true);

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Activity Detection State
  const [enableVAD, setEnableVAD] = useState(true);
  const [silenceDuration, setSilenceDuration] = useState(1500);
  const [prefixPadding, setPrefixPadding] = useState(500);
  const [endSpeechSensitivity, setEndSpeechSensitivity] = useState(
    "END_SENSITIVITY_UNSPECIFIED"
  );
  const [startSpeechSensitivity, setStartSpeechSensitivity] = useState(
    "START_SENSITIVITY_UNSPECIFIED"
  );

  // Media State
  const [audioStreaming, setAudioStreaming] = useState(false);
  const [videoStreaming, setVideoStreaming] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Refs
  const clientRef = useRef(null);
  const audioStreamerRef = useRef(null);
  const videoStreamerRef = useRef(null);
  const screenCaptureRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const chatContainerRef = useRef(null);
  const activeToolsMapRef = useRef({});

  // Initialize Media Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(
          devices.filter((device) => device.kind === "audioinput")
        );
        setVideoInputDevices(
          devices.filter((device) => device.kind === "videoinput")
        );
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };
    getDevices();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const addMessage = (text, type, mode = "add", isFinished = false) => {
    setChatMessages((prev) => {
      // Check if we can modify the last message
      if (
        mode !== "add" &&
        prev.length > 0 &&
        prev[prev.length - 1].type === type &&
        !prev[prev.length - 1].isFinished
      ) {
        const newMessages = [...prev];
        // Create a shallow copy of the message to avoid mutating state directly
        const target = { ...newMessages[newMessages.length - 1] };
        newMessages[newMessages.length - 1] = target;

        if (mode === "append") {
          target.text += text;
        } else if (mode === "replace") {
          // Only replace if text is provided and not just whitespace
          if (text && text.trim().length > 0) {
            target.text = text;
          }
        }

        if (isFinished) {
          target.isFinished = true;
        }
        return newMessages;
      }

      // Create new message
      // Don't create empty messages
      if ((!text || text.trim().length === 0) && !isFinished) return prev;

      return [...prev, { text: text || "", type, isFinished }];
    });
  };

  const handleMessage = (message) => {
    // Normalizing event types from Adapter

    switch (message.type) {
      case 'text':
        addMessage(message.data, "assistant", "append", message.endOfTurn);
        break;
      case 'audio':
        if (audioPlayerRef.current) {
          audioPlayerRef.current.play(message.data);
        }
        break;
      case 'input_transcription':
        addMessage(
          message.data.text,
          "user-transcript",
          "append",
          message.data.finished
        );
        break;
      case 'output_transcription':
        addMessage(
          message.data.text,
          "assistant",
          "append",
          message.data.finished
        );
        break;
      case 'setup_complete':
        addMessage("Ready!", "system");
        break;
      case 'tool_call':
        const functionCalls = message.data.functionCalls;
        functionCalls.forEach((call) => {
          const tool = activeToolsMapRef.current[call.name];
          if (tool) {
            tool.runFunction(call.args);
          } else {
            console.warn(`Unknown tool called: ${call.name}`);
          }
        });
        break;
      case 'turn_complete':
        // setDebugInfo("Turn complete");
        break;
      case 'interrupted':
        addMessage("[Interrupted]", "system");
        if (audioPlayerRef.current) audioPlayerRef.current.interrupt();
        break;
      case 'error': // Adapter might emit error as content or event
        addMessage(`[Error: ${message.data}]`, "system");
        break;
      default:
        break;
    }
  };

  const disconnect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      // Keep clientRef.current to reuse it
    }

    if (audioStreamerRef.current) {
      await audioStreamerRef.current.stop();
      // Keep streamer instance
    }
    if (videoStreamerRef.current) {
      await videoStreamerRef.current.stop();
    }
    if (screenCaptureRef.current) {
      await screenCaptureRef.current.stop();
    }

    // Don't destroy audioPlayer, just let it be idle
    if (audioPlayerRef.current && audioPlayerRef.current.audioContext) {
      if (audioPlayerRef.current.audioContext.state !== 'closed') {
        try {
          // Suspending rather than closing to allow reuse
          await audioPlayerRef.current.audioContext.suspend();
        } catch (e) {
          console.warn("Could not suspend audio context:", e);
        }
      }
    }

    setConnected(false);
    setConnecting(false);
    setAudioStreaming(false);
    setVideoStreaming(false);
    setScreenSharing(false);

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.hidden = true;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    if (connecting || connected) return;

    const currentApiKey = provider === "live" ? liveApiKey : flashApiKey;

    if (!currentApiKey) {
      alert(`Please provide an API Key for ${provider === 'live' ? 'Gemini Live' : 'Gemini Flash'}`);
      return;
    }

    setConnecting(true);

    try {
      // Reuse or create client
      // Create new adapter instance via Factory
      // Always recreate on connect to ensure fresh config
      clientRef.current = ModelClient.createAdapter(provider, {
        apiKey: provider === "live" ? liveApiKey : flashApiKey,
        modelId: model,
        voice: voice,
        systemInstruction: systemInstructions,
        // Activity Detection Settings
        enableVAD,
        silenceDuration: parseInt(silenceDuration),
        prefixPadding: parseInt(prefixPadding),
        startSpeechSensitivity,
        endSpeechSensitivity
      });
      // Setup listeners (Adapter Pattern uses EventEmitter style)
      clientRef.current.on('content', handleMessage);
      clientRef.current.on('open', () => {
        setConnected(true);
        setConnecting(false);
      });
      clientRef.current.on('close', async () => {
        // Only update state, don't call disconnect() to avoid recursion
        setConnected(false);
        setConnecting(false);
        // Stop media streamers gracefully
        if (audioStreamerRef.current) await audioStreamerRef.current.stop();
        if (videoStreamerRef.current) await videoStreamerRef.current.stop();
        if (screenCaptureRef.current) await screenCaptureRef.current.stop();
        setAudioStreaming(false);
        setVideoStreaming(false);
        setScreenSharing(false);
      });
      clientRef.current.on('error', (err) => {
        console.error("Adapter Error:", err);
        setConnecting(false);
      });
      clientRef.current.apiKey = provider === "live" ? liveApiKey : flashApiKey;
      clientRef.current.model = model;

      // Set config
      clientRef.current.setSystemInstructions(systemInstructions);
      clientRef.current.setVoice(voice);

      // Setup Tools
      const tools = [];
      const functionDecls = [];
      const activeTools = {};

      if (enableGrounding) {
        tools.push({ googleSearch: {} });
      }

      if (enableAlertTool) {
        const tool = new ShowAlertTool();
        activeTools[tool.name] = tool;
        functionDecls.push(tool.getDefinition());
      }
      if (enableCssStyleTool) {
        const tool = new AddCSSStyleTool();
        activeTools[tool.name] = tool;
        functionDecls.push(tool.getDefinition());
      }

      if (functionDecls.length > 0) {
        tools.push({ functionDeclarations: functionDecls });
      }

      activeToolsMapRef.current = activeTools;
      clientRef.current.setTools(tools);

      // These callbacks are deprecated but kept for backwards compatibility
      clientRef.current.onReceiveResponse = handleMessage;
      clientRef.current.onErrorMessage = (error) => {
        console.error("Error:", error);
        setConnecting(false);
      };
      clientRef.current.onConnectionStarted = () => {
        setConnected(true);
        setConnecting(false);
      };
      clientRef.current.onClose = () => {
        setConnected(false);
        setConnecting(false);
      };

      const success = await clientRef.current.connect();

      if (success) {
        // Always re-create streamers with the new client reference
        // This ensures they point to the correct adapter instance
        if (audioStreamerRef.current) audioStreamerRef.current.stop();
        audioStreamerRef.current = new AudioStreamer(clientRef.current);
        audioStreamerRef.current.vadSpeechHoldTime = parseInt(silenceDuration);


        if (videoStreamerRef.current) videoStreamerRef.current.stop();
        videoStreamerRef.current = new VideoStreamer(clientRef.current);

        if (screenCaptureRef.current) screenCaptureRef.current.stop();
        screenCaptureRef.current = new ScreenCapture(clientRef.current);

        // Ensure AudioPlayer is initialized and resumed
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new AudioPlayer();
        }
        await audioPlayerRef.current.init();

        // Resume audio context if it was suspended
        if (audioPlayerRef.current.audioContext && audioPlayerRef.current.audioContext.state === 'suspended') {
          await audioPlayerRef.current.audioContext.resume();
          console.log("🔊 Audio context resumed");
        }

        audioPlayerRef.current.setVolume(volume / 100);
      } else {
        setConnecting(false);
      }
    } catch (error) {
      console.error("Connection failed:", error);
      setConnecting(false);
    }
  };

  const toggleAudio = async () => {
    if (!audioStreaming) {
      try {
        if (!audioStreamerRef.current && clientRef.current) {
          audioStreamerRef.current = new AudioStreamer(clientRef.current);
        }

        if (audioStreamerRef.current) {
          // Configure VAD and callbacks
          audioStreamerRef.current.vadEnabled = enableVAD;
          audioStreamerRef.current.vadSpeechHoldTime = parseInt(silenceDuration);

          audioStreamerRef.current.onSpeechStatusChange = (isSpeaking) => {
            setIsUserSpeaking(isSpeaking);
            // Control video transmission based on speech
            if (enableVAD) {
              if (videoStreamerRef.current) videoStreamerRef.current.transmitFrames = isSpeaking;
              if (screenCaptureRef.current) screenCaptureRef.current.transmitFrames = isSpeaking;
            }
          };

          await audioStreamerRef.current.start(selectedMic);
          setAudioStreaming(true);
          addMessage("[Microphone on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Audio error: " + error.message + "]", "system");
      }
    } else {
      if (audioStreamerRef.current) await audioStreamerRef.current.stop();
      setAudioStreaming(false);
      addMessage("[Microphone off]", "system");
    }
  };

  const toggleVideo = async () => {
    if (!videoStreaming) {
      try {
        if (!videoStreamerRef.current && clientRef.current) {
          videoStreamerRef.current = new VideoStreamer(clientRef.current);
        }

        if (videoStreamerRef.current) {
          const video = await videoStreamerRef.current.start({
            deviceId: selectedCamera,
          });
          setVideoStreaming(true);

          // Configure Video Optimization
          if (videoStreamerRef.current) {
            videoStreamerRef.current.alwaysTransmit = !enableVAD;
          }

          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = video.srcObject;
            videoPreviewRef.current.hidden = false;
          }
          props.onPreviewStreamChange?.(video.srcObject);
          addMessage("[Camera on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Video error: " + error.message + "]", "system");
      }
    } else {
      if (videoStreamerRef.current) await videoStreamerRef.current.stop();
      setVideoStreaming(false);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.hidden = true;
      }
      props.onPreviewStreamChange?.(null);
      addMessage("[Camera off]", "system");
    }
  };

  const toggleScreen = async () => {
    if (!screenSharing) {
      try {
        if (!screenCaptureRef.current && clientRef.current) {
          screenCaptureRef.current = new ScreenCapture(clientRef.current);
        }

        if (screenCaptureRef.current) {
          const video = await screenCaptureRef.current.start();
          setScreenSharing(true);

          // Configure Screen Optimization
          if (screenCaptureRef.current) {
            screenCaptureRef.current.alwaysTransmit = !enableVAD;
          }

          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = video.srcObject;
            videoPreviewRef.current.hidden = false;
          }
          props.onPreviewStreamChange?.(video.srcObject);
          addMessage("[Screen sharing on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Screen share error: " + error.message + "]", "system");
      }
    } else {
      if (screenCaptureRef.current) await screenCaptureRef.current.stop();
      setScreenSharing(false);
      if (!videoStreaming && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.hidden = true;
      }
      props.onPreviewStreamChange?.(null);
      addMessage("[Screen sharing off]", "system");
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    if (clientRef.current) {
      addMessage(chatInput, "user");

      let base64Image = null;

      // If optimizing token usage, send a snapshot frame before the text
      if (enableVAD) {
        let snapshot = null;
        if (videoStreaming && videoStreamerRef.current) {
          try {
            snapshot = videoStreamerRef.current.takeSnapshot();
          } catch (e) { console.error("Snapshot failed", e); }
        } else if (screenSharing && screenCaptureRef.current) {
          try {
            snapshot = screenCaptureRef.current.takeSnapshot();
          } catch (e) { console.error("Snapshot failed", e); }
        }

        if (snapshot) {
          base64Image = snapshot.split(",")[1];
        }
      }

      clientRef.current.sendText(chatInput, base64Image);
      setChatInput("");
    } else {
      addMessage("[Connect to Gemini first]", "system");
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setVolume(newVolume / 100);
    }
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  useImperativeHandle(ref, () => ({
    connect,
    disconnect,
    toggleAudio,
    toggleScreen,
    setConfig: (config) => {
      if (config.systemInstructions) {
        setSystemInstructions(config.systemInstructions);
        if (clientRef.current) {
          clientRef.current.systemInstructions = config.systemInstructions;
        }
      }
      if (config.voice) {
        setVoice(config.voice);
        if (clientRef.current) {
          clientRef.current.voiceName = config.voice;
        }
      }
    },
  }));

  const applyPersona = (persona) => {
    setSystemInstructions(persona.instructions);
    setVoice(persona.voice);
    if (clientRef.current) {
      clientRef.current.setSystemInstructions(persona.instructions);
      clientRef.current.setVoice(persona.voice);
    }
  };

  useEffect(() => {
    props.onConnectingChange?.(connecting);
  }, [connecting, props.onConnectingChange]);

  useEffect(() => {
    props.onConnectionChange?.(connected);
  }, [connected, props.onConnectionChange]);

  useEffect(() => {
    props.onAudioStreamChange?.(audioStreaming);
  }, [audioStreaming, props.onAudioStreamChange]);

  useEffect(() => {
    props.onScreenShareChange?.(screenSharing);
  }, [screenSharing, props.onScreenShareChange]);

  // Update VAD settings dynamically
  useEffect(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.vadSpeechHoldTime = parseInt(silenceDuration);
    }
  }, [silenceDuration]);


  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    if (newProvider === "live") {
      setModel("gemini-2.5-flash-native-audio-preview-12-2025");
    } else if (newProvider === "flash") {
      setModel("gemini-2.5-flash");
    }
  };

  return (
    <div className="live-api-demo">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1>Real-time streaming assistant</h1>
        </div>
        <div className="toolbar-center">
          <div className="dropdown">
            <button className="dropbtn" onClick={() => toggleDropdown('config')}>
              Configuration {openDropdown === 'config' ? '▴' : '▾'}
            </button>
            <div className={`dropdown-content config-dropdown ${openDropdown === 'config' ? 'show' : ''}`}>
              {/* API Configuration Section */}
              <div className="config-tabs">
                <button
                  className={`tab-button ${configTab === 'model' ? 'active' : ''}`}
                  onClick={() => setConfigTab('model')}
                >
                  Model & Connection
                </button>
                <button
                  className={`tab-button ${configTab === 'behavior' ? 'active' : ''}`}
                  onClick={() => setConfigTab('behavior')}
                >
                  Behavior & VAD
                </button>
              </div>

              {configTab === 'model' && (
                <div className="tab-content">
                  <div className="control-group">
                    <h3>Model Settings</h3>
                    <div className="input-group">
                      <label>Service Provider:</label>
                      <select
                        value={provider}
                        onChange={handleProviderChange}
                        disabled={connected}
                      >
                        <option value="live">Gemini Live (WebSocket)</option>
                        <option value="flash">Gemini 2.5 Flash (REST)</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>API Key ({provider === 'live' ? 'Live' : 'Flash'}):</label>
                      <input
                        type="password"
                        value={provider === 'live' ? liveApiKey : flashApiKey}
                        onChange={(e) => {
                          if (provider === 'live') setLiveApiKey(e.target.value);
                          else setFlashApiKey(e.target.value);
                        }}
                        disabled={connected}
                        placeholder={`Enter ${provider === 'live' ? 'Live' : 'Flash'} API Key`}
                      />
                    </div>

                    <div className="input-group">
                      <label>Model ID:</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={connected}
                      />
                    </div>
                  </div>

                  {provider === 'live' && (
                    <div className="control-group">
                      <h3>Live API Specifics</h3>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={enableProactiveAudio}
                          onChange={(e) => setEnableProactiveAudio(e.target.checked)}
                          disabled={connected}
                        />
                        <label>Enable proactive audio</label>
                      </div>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={enableAffectiveDialog}
                          onChange={(e) => setEnableAffectiveDialog(e.target.checked)}
                          disabled={connected}
                        />
                        <label>Enable affective dialog</label>
                      </div>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={enableInputTranscription}
                          onChange={(e) => setEnableInputTranscription(e.target.checked)}
                          disabled={connected}
                        />
                        <label>Enable input transcription</label>
                      </div>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={enableOutputTranscription}
                          onChange={(e) => setEnableOutputTranscription(e.target.checked)}
                          disabled={connected}
                        />
                        <label>Enable output transcription</label>
                      </div>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={enableGrounding}
                          onChange={(e) => setEnableGrounding(e.target.checked)}
                          disabled={connected}
                        />
                        <label>Enable Google grounding</label>
                      </div>
                    </div>
                  )}
                  {provider === 'live' && (
                    <div className="control-group">
                      <h3>Live API VAD Settings</h3>
                      <div className="input-group">
                        <label>End of speech sensitivity:</label>
                        <select
                          value={endSpeechSensitivity}
                          onChange={(e) => setEndSpeechSensitivity(e.target.value)}
                          disabled={connected}
                        >
                          <option value="END_SENSITIVITY_UNSPECIFIED">Default</option>
                          <option value="END_SENSITIVITY_HIGH">High</option>
                          <option value="END_SENSITIVITY_LOW">Low</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Start of speech sensitivity:</label>
                        <select
                          value={startSpeechSensitivity}
                          onChange={(e) => setStartSpeechSensitivity(e.target.value)}
                          disabled={connected}
                        >
                          <option value="START_SENSITIVITY_UNSPECIFIED">
                            Default
                          </option>
                          <option value="START_SENSITIVITY_HIGH">High</option>
                          <option value="START_SENSITIVITY_LOW">Low</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {configTab === 'behavior' && (
                <div className="tab-content">
                  <div className="control-group">
                    <h3>Persona</h3>
                    <div className="persona-grid">
                      {PERSONAS.map((persona) => (
                        <button
                          key={persona.name}
                          className={`persona-card ${voice === persona.voice ? "selected" : ""}`}
                          onClick={() => applyPersona(persona)}
                          disabled={connected}
                        >
                          <div className="persona-emoji">{persona.emoji}</div>
                          <div className="persona-name">{persona.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <h3>Instructions & Voice</h3>
                    <div className="input-group">
                      <label>System Instructions:</label>
                      <textarea
                        rows="4"
                        value={systemInstructions}
                        onChange={(e) => setSystemInstructions(e.target.value)}
                        disabled={connected}
                      />
                    </div>
                    <div className="input-group">
                      <label>Voice:</label>
                      <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        disabled={connected}
                      >
                        <option value="Puck">Puck</option>
                        <option value="Charon">Charon</option>
                        <option value="Kore">Kore</option>
                        <option value="Fenrir">Fenrir</option>
                        <option value="Aoede">Aoede</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Temperature: {temperature}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        disabled={connected}
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <h3>Client VAD Settings</h3>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={enableVAD}
                        onChange={(e) => setEnableVAD(e.target.checked)}
                        disabled={connected}
                      />
                      <label>Enable Client VAD</label>
                    </div>
                    <div className="input-group">
                      <label>Silence duration (ms):</label>
                      <input
                        type="number"
                        value={silenceDuration}
                        onChange={(e) => setSilenceDuration(e.target.value)}
                        min="500"
                        max="10000"
                        step="100"
                        disabled={connected}
                      />
                    </div>
                    <div className="input-group">
                      <label>Prefix padding (ms):</label>
                      <input
                        type="number"
                        value={prefixPadding}
                        onChange={(e) => setPrefixPadding(e.target.value)}
                        min="0"
                        max="2000"
                        step="100"
                        disabled={connected}
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <h3>Custom Tools</h3>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={enableAlertTool}
                        onChange={(e) => setEnableAlertTool(e.target.checked)}
                        disabled={connected || enableGrounding}
                      />
                      <label>Show Alert Box</label>
                    </div>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={enableCssStyleTool}
                        onChange={(e) => setEnableCssStyleTool(e.target.checked)}
                        disabled={connected || enableGrounding}
                      />
                      <label>Add CSS Style</label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {setupJson && (
              <div className="control-group">
                <h3>Setup Message JSON</h3>
                <pre className="setup-json-display">
                  {JSON.stringify(setupJson, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={connected ? disconnect : connect}
            className={connected ? "disconnect" : (connecting ? "connecting" : "active")}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : (connected ? "Disconnect" : "Connect")}
          </button>

          <div className="dropdown">
            <button className="dropbtn" onClick={() => toggleDropdown('media')}>
              Media {openDropdown === 'media' ? '▴' : '▾'}
            </button>
            <div className={`dropdown-content media-dropdown ${openDropdown === 'media' ? 'show' : ''}`}>
              {/* Media Streaming Section */}
              <div className="control-group">
                <div className="input-group">
                  <label>Microphone:</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                  >
                    <option value="">Default Microphone</option>
                    {audioInputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Camera:</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                  >
                    <option value="">Default Camera</option>
                    {videoInputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="button-group-vertical">
                  <button
                    onClick={toggleAudio}
                    className={audioStreaming ? "active" : ""}
                  >
                    {audioStreaming ? "Stop Audio" : "Start Audio"}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={videoStreaming ? "active" : ""}
                  >
                    {videoStreaming ? "Stop Video" : "Start Video"}
                  </button>
                  <button
                    onClick={toggleScreen}
                    className={screenSharing ? "active" : ""}
                  >
                    {screenSharing ? "Stop Sharing" : "Share Screen"}
                  </button>
                </div>

                <div className="input-group">
                  <label>Output volume: {volume}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>




      <div className="main-app-area">
        <div className="video-container">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className={`video-preview ${videoStreaming || screenSharing ? "" : "hidden"}`}
          />
          {!(videoStreaming || screenSharing) && (
            <div className="video-placeholder">
              <div className="placeholder-icon">📷</div>
              <p>Camera / Screen off</p>
            </div>
          )}
        </div>
        <div className="chat-interface">
          <div className="chat-log" ref={chatContainerRef}>
            {chatMessages.length === 0 && (
              <div className="chat-placeholder">
                <p>Ready to chat...</p>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              disabled={!connected}
            />
            <button onClick={sendMessage} className="send-button" disabled={!connected}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info Section Removed */}
    </div >
  );
});

export default LiveAPIDemo;
