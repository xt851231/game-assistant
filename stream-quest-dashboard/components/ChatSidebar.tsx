import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Settings, X, Send, Crown, Bot, Mic } from 'lucide-react';

interface ChatSidebarProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    onClose: () => void;
    videoStream: MediaStream | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, onSendMessage, onClose, videoStream }) => {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <aside data-component="ChatSidebar" className="w-full h-full bg-[#0c1219] border-2 border-[#2b6cee] rounded-xl flex flex-col z-10 shadow-lg overflow-hidden relative">
            {/* Header */}
            <div className="p-3 bg-[#162032] border-b-2 border-[#1e293b] flex justify-between items-center shrink-0">
                <h2 className="font-pixel text-[9px] text-[#ffd700] tracking-widest">PARTY COMMS</h2>
                <div className="flex gap-1">
                    <button
                        onClick={onClose}
                        className="hover:text-red-500 text-gray-500 transition-colors"
                        title="Close Chat"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[#111722] relative scroll-smooth">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>

                {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2 group animate-in slide-in-from-right-2 duration-300">
                        <div className="shrink-0 mt-1">
                            {msg.sender === 'System' ? (
                                <div className="size-6 bg-yellow-900/50 rounded border border-yellow-500 flex items-center justify-center">
                                    <Crown size={12} className="text-yellow-500" />
                                </div>
                            ) : msg.type === 'assistant' ? (
                                <div className="size-6 bg-purple-900/50 rounded border border-purple-500 flex items-center justify-center">
                                    <Bot size={12} className="text-purple-400" />
                                </div>
                            ) : (
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`}
                                    alt="Avatar"
                                    className="size-6 bg-indigo-900 rounded border border-indigo-400"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-0.5 max-w-[85%]">
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${msg.type === 'system' ? 'text-yellow-500' :
                                msg.type === 'assistant' ? 'text-purple-400' :
                                    'text-blue-300'
                                }`}>
                                {msg.sender}
                                {msg.isMod && <span className="bg-blue-600 text-[7px] px-1 rounded text-white leading-tight">MOD</span>}
                            </span>

                            {msg.type === 'system' ? (
                                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded px-2 py-1 text-center">
                                    <p className="text-[9px] text-yellow-500 font-pixel">{msg.text}</p>
                                </div>
                            ) : (
                                <div className={`border rounded p-2 text-[11px] shadow-sm relative ${msg.type === 'assistant'
                                    ? 'bg-[#2a1b3d] border-purple-500/50 text-gray-200'
                                    : 'bg-[#1e293b] border-gray-600 text-gray-200'
                                    }`}>
                                    {msg.text}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#162032] border-t-2 border-[#1e293b] shrink-0 z-20">
                <form onSubmit={handleSubmit} className="flex gap-2 items-center h-10 w-full">
                    <input
                        className="flex-1 bg-[#0a0f16] border border-gray-600 text-white rounded px-3 text-[11px] focus:outline-none focus:border-[#ffd700] placeholder-gray-600 font-display transition-colors h-full"
                        placeholder="Send message..."
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="h-full aspect-square bg-[#2b6cee] rounded border border-blue-400 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-sm">
                        <Send size={16} />
                    </button>
                </form>
            </div>

            {/* Secondary Vision Port (PIP) */}
            <div className="p-4 bg-[#0c1219] shrink-0 border-t border-[#1e293b]">
                <div className="w-full aspect-video bg-black relative rounded-lg border-2 border-[#232f48] overflow-hidden group shadow-inner flex items-center justify-center">
                    {videoStream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-[10px] text-gray-600 font-pixel">NO SIGNAL</span>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default ChatSidebar;