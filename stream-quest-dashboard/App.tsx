import React, { useState } from 'react';
import { AppConfig, MediaConfig, ConnectionState, Message } from './types';
import { DEFAULT_CONFIG, DEFAULT_MEDIA_CONFIG, INITIAL_MESSAGES } from './constants';
import ConfigurationMenu from './components/ConfigurationMenu';
import MediaControlHub from './components/MediaControlHub';
import Stage from './components/Stage';
import Toolbelt from './components/Toolbelt';
import ChatSidebar from './components/ChatSidebar';
import { useLiveAPI } from './hooks/useLiveAPI';
import { Swords, Zap, Settings, Video, Mic, Monitor, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
    // Context
    const {
        connected,
        connecting,
        connect,
        disconnect,
        messages,
        sendMessage,
        toggleAudio,
        toggleVideo,
        toggleScreen,
        videoStream,
        cameraStream,
        screenSharing,
        audioStreaming,
        videoStreaming,
        setOverlayCanvas // Add this
    } = useLiveAPI();

    // State
    const [config, setConfig] = useState<AppConfig>(() => {
        try {
            const savedConfig = localStorage.getItem('app_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                return { ...DEFAULT_CONFIG, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load config from localStorage", e);
        }
        return DEFAULT_CONFIG;
    });
    const [mediaConfig, setMediaConfig] = useState<MediaConfig>(() => {
        try {
            const savedConfig = localStorage.getItem('media_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Always start with screen sharing disabled to avoid permission prompts on reload
                return { ...DEFAULT_MEDIA_CONFIG, ...parsed, screenShareEnabled: false };
            }
        } catch (e) {
            console.error("Failed to load media config", e);
        }
        return DEFAULT_MEDIA_CONFIG;
    });

    // Save config to localStorage whenever it changes
    React.useEffect(() => {
        localStorage.setItem('app_config', JSON.stringify(config));
    }, [config]);

    React.useEffect(() => {
        localStorage.setItem('media_config', JSON.stringify(mediaConfig));
    }, [mediaConfig]);

    // Derived State
    const connectionState: ConnectionState = connected ? 'connected' : connecting ? 'connecting' : 'disconnected';

    const [gameTitle, setGameTitle] = useState('bigger better sue');

    // UI Toggles
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);

    // Tooling
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#ffd700');
    const [brushSize, setBrushSize] = useState(4);

    // Handlers
    const handleConnect = async () => {
        if (connected) {
            await disconnect();
        } else {
            await connect(config);
        }
    };

    const handleSendMessage = (text: string) => {
        sendMessage(text, config);
    };

    // Media Handlers
    // Media Handlers
    const handleMediaConfigChange = (newConfig: MediaConfig) => {
        console.log('🔧 handleMediaConfigChange:', newConfig);
        setMediaConfig(newConfig);

        // Direct Toggle Logic - Source of Truth is the Context
        // Audio
        if (newConfig.audioEnabled !== audioStreaming ||
            (audioStreaming && newConfig.microphoneId !== mediaConfig.microphoneId)) {
            toggleAudio(newConfig.audioEnabled, newConfig.microphoneId || 'default', config);
        }

        // Video (Camera)
        if (newConfig.videoEnabled !== videoStreaming ||
            (videoStreaming && newConfig.cameraId !== mediaConfig.cameraId)) {
            toggleVideo(newConfig.videoEnabled, newConfig.cameraId || 'default', config);
        }

        // Screen Share
        if (newConfig.screenShareEnabled !== screenSharing) {
            toggleScreen(newConfig.screenShareEnabled, config);
        }
    };

    // Calculate effective config regarding active states from Context
    // This ensures the UI always reflects the REAL state, not just the local config
    const effectiveMediaConfig: MediaConfig = {
        ...mediaConfig,
        audioEnabled: audioStreaming,
        videoEnabled: videoStreaming,
        screenShareEnabled: screenSharing
    };

    /* 
       Refactor Note: 
       Removed previous existing Media Config Sync useEffect. 
       We now trigger toggles directly in the handler, and derive UI state from context.
       This prevents state desync and "Permission denied" loops on reload.
    */

    // ...



    const triggerClearStage = () => {
        // Dispatch custom event for Stage component
        const event = new Event('STAGE_CLEAR');
        document.dispatchEvent(event);
    };

    return (
        <div data-component="App" className="aspect-[16/9] w-full max-w-[100vw] max-h-[100vh] bg-[#111722] overflow-hidden flex flex-col border-4 border-[#1e293b] relative shadow-2xl mx-auto my-auto">

            {/* Header with Background Image */}
            <header
                data-component="AppHeader"
                className="h-[8%] shrink-0 z-40 px-4 py-1 bg-[#0a0f16] border-b-4 border-[#2b6cee] flex items-center justify-between shadow-lg relative bg-cover bg-center"
                style={{ backgroundImage: 'linear-gradient(to bottom, rgba(10, 15, 22, 0.8), rgba(10, 15, 22, 0.9))' }}
            >

                {/* Branding */}
                <div className="flex items-center gap-3 select-none">
                    <div className="size-8 bg-gradient-to-br from-blue-600 to-blue-900 rounded border-2 border-white flex items-center justify-center shadow-pixel-sm">
                        <Swords className="text-white" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-pixel text-[10px] text-[#ffd700] mb-0.5 tracking-widest">STREAM QUEST</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] uppercase bg-green-600 px-1 rounded text-white font-bold">LVL 99</span>
                            <span className="text-[10px] text-gray-400">DASHBOARD</span>
                        </div>
                    </div>
                </div>

                {/* Connection Status & Action */}
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 items-center">
                        <div className={`size-2 rounded-full animate-pulse ${connectionState === 'connected' ? 'bg-green-500' :
                            connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                        <span className={`text-[10px] font-bold tracking-wider ${connectionState === 'connected' ? 'text-green-400' :
                            connectionState === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {connectionState === 'connected' ? 'ONLINE' :
                                connectionState === 'connecting' ? 'SYNCING...' : 'OFFLINE'}
                        </span>
                    </div>

                    <button
                        onClick={handleConnect}
                        className={`btn-pixel relative group overflow-hidden border-2 border-white text-white px-3 py-1 rounded shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[2px] ${connectionState === 'connected' ? 'bg-red-700' : 'bg-gradient-to-b from-blue-600 to-blue-800'
                            }`}
                    >
                        <div className="flex items-center gap-1.5 relative z-10">
                            <Zap size={14} fill="currentColor" />
                            <span className="font-bold text-[10px] tracking-wider font-pixel">
                                {connectionState === 'connected' ? 'DISCONNECT' : 'GO LIVE'}
                            </span>
                        </div>
                    </button>
                </div>
            </header>

            {/* Main Content Flex with Gap and Padding + Background Image */}
            <div
                className="flex-1 flex overflow-hidden p-6 bg-[#111722] bg-cover bg-center relative"
                style={{ backgroundImage: 'linear-gradient(rgba(17, 23, 34, 0.9), rgba(17, 23, 34, 0.95))' }}
            >

                {/* Workspace Panel */}
                <main data-component="AppMain" className="flex-1 flex flex-col min-w-0 bg-[#05080c]/80 backdrop-blur-sm rounded-xl border-2 border-[#2b6cee] shadow-2xl relative overflow-hidden transition-all duration-500">

                    {/* Inner Container */}
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">

                        {/* Toolbar Row */}
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div className="relative px-4 py-2 min-w-[280px]">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/50 to-transparent border-l-4 border-[#ffd700] transform skew-x-[-12deg] rounded-r-lg"></div>
                                <div className="relative flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#ffd700] text-2xl">
                                        <Swords size={28} className="text-[#ffd700]" />
                                    </span>
                                    <div className="flex flex-col w-full">
                                        <span className="text-[8px] text-blue-200 uppercase tracking-widest font-bold mb-0.5">Currently Playing</span>
                                        <input
                                            type="text"
                                            value={gameTitle}
                                            onChange={(e) => setGameTitle(e.target.value)}
                                            className="font-pixel text-lg text-white tracking-widest bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-[#ffd700] outline-none transition-colors w-full h-8"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Toggles */}
                            <div className="flex gap-2 items-center relative z-50">
                                <button
                                    onClick={() => { setIsConfigOpen(!isConfigOpen); setIsMediaOpen(false); }}
                                    className={`rpg-window px-3 py-2 flex items-center justify-center border-2 border-white transition-all hover:-translate-y-0.5 ${isConfigOpen ? 'bg-[#ffd700] border-white' : 'bg-blue-900'
                                        }`}
                                >
                                    <Settings size={18} className={isConfigOpen ? 'text-black' : 'text-white'} />
                                </button>
                                <button
                                    onClick={() => { setIsMediaOpen(!isMediaOpen); setIsConfigOpen(false); }}
                                    className={`rpg-window px-3 py-2 flex items-center justify-center border-2 border-white transition-all hover:-translate-y-0.5 ${isMediaOpen ? 'bg-[#ffd700] border-white' : 'bg-blue-900'
                                        }`}
                                >
                                    <Video size={18} className={isMediaOpen ? 'text-black' : 'text-white'} />
                                </button>
                                <button
                                    onClick={() => toggleAudio(!audioStreaming, 'default', config)}
                                    className={`rpg-window px-3 py-2 flex items-center justify-center border-2 border-white transition-all hover:-translate-y-0.5 ${audioStreaming ? 'bg-[#ffd700] border-white' : 'bg-blue-900'}`}
                                >
                                    <Mic size={18} className={audioStreaming ? 'text-black' : 'text-white'} />
                                </button>
                                <button
                                    onClick={() => toggleScreen(!screenSharing, config)}
                                    className={`rpg-window px-3 py-2 flex items-center justify-center border-2 border-white transition-all hover:-translate-y-0.5 ${screenSharing ? 'bg-[#ffd700] border-white' : 'bg-blue-900'}`}
                                >
                                    <Monitor size={18} className={screenSharing ? 'text-black' : 'text-white'} />
                                </button>
                                <button
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className={`rpg-window px-3 py-2 flex items-center justify-center border-2 border-white transition-all hover:-translate-y-0.5 ${isChatOpen ? 'bg-[#ffd700] border-white' : 'bg-blue-900'
                                        }`}
                                    title="Toggle Chat"
                                >
                                    <MessageSquare size={18} className={isChatOpen ? 'text-black' : 'text-white'} />
                                </button>

                                {/* Dropdowns */}
                                <ConfigurationMenu
                                    isOpen={isConfigOpen}
                                    config={config}
                                    onConfigChange={setConfig}
                                    onClose={() => setIsConfigOpen(false)}
                                />
                                <MediaControlHub
                                    isOpen={isMediaOpen}
                                    config={effectiveMediaConfig}
                                    onConfigChange={handleMediaConfigChange}
                                    onClose={() => setIsMediaOpen(false)}
                                />
                            </div>
                        </div>

                        {/* Stage & Tools */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <Stage
                                tool={tool}
                                color={color}
                                brushSize={brushSize}
                                onClear={triggerClearStage}
                                videoStream={videoStream}
                                onCanvasReady={setOverlayCanvas}
                            />

                            <Toolbelt
                                tool={tool}
                                setTool={setTool}
                                color={color}
                                setColor={setColor}
                                brushSize={brushSize}
                                setBrushSize={setBrushSize}
                                onClear={triggerClearStage}
                            />
                        </div>
                    </div>
                </main>

                {/* Sidebar Container with Transition */}
                <div
                    data-component="SidebarWrapper"
                    className={`flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isChatOpen
                        ? 'w-[22%] opacity-100 ml-6 translate-x-0'
                        : 'w-0 opacity-0 ml-0 translate-x-10'
                        }`}
                >
                    <ChatSidebar
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onClose={() => setIsChatOpen(false)}
                        videoStream={screenSharing ? cameraStream : null}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;