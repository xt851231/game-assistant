import React, { useState } from 'react';
import { AppConfig, Persona } from '../types';
import { PERSONAS, VOICES } from '../constants';
import { Cpu, Activity, Save } from 'lucide-react';

interface ConfigurationMenuProps {
    isOpen: boolean;
    config: AppConfig;
    onConfigChange: (newConfig: AppConfig) => void;
    onClose: () => void;
}

const ConfigurationMenu: React.FC<ConfigurationMenuProps> = ({ isOpen, config, onConfigChange, onClose }) => {
    const [activeTab, setActiveTab] = useState<'model' | 'behavior'>('model');

    if (!isOpen) return null;

    const handleChange = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
        onConfigChange({ ...config, [key]: value });
    };

    return (
        <div role="dialog" data-component="ConfigurationMenu" className="absolute top-14 right-0 z-50 w-[480px] rpg-window shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header Tabs */}
            <div className="flex border-b-2 border-white bg-blue-900">
                <button
                    onClick={() => setActiveTab('model')}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-pixel text-[10px] transition-colors ${activeTab === 'model' ? 'bg-[#2b6cee] text-white' : 'bg-[#1e3a8a] text-gray-400 hover:text-white'
                        }`}
                >
                    <Cpu size={14} />
                    Model & Connect
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-pixel text-[10px] transition-colors ${activeTab === 'behavior' ? 'bg-[#2b6cee] text-white' : 'bg-[#1e3a8a] text-gray-400 hover:text-white'
                        }`}
                >
                    <Activity size={14} />
                    Behavior & VAD
                </button>
            </div>

            <div className="p-4 bg-[#0a0f16] max-h-[60vh] overflow-y-auto">
                {activeTab === 'model' ? (
                    <div className="space-y-6">
                        {/* Model Configuration */}
                        <section className="space-y-3">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-2 border-b border-gray-700 pb-1">
                                Connection Settings
                            </h3>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">Provider</label>
                                <select
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-sm rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    value={config.provider}
                                    onChange={(e) => handleChange('provider', e.target.value as any)}
                                >
                                    <option value="gemini-live-websocket">Gemini Live (WebSocket)</option>
                                    <option value="gemini-flash-rest">Gemini Flash (REST)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">API Key</label>
                                <input
                                    type="password"
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-sm rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    placeholder="Enter API Key..."
                                    value={config.apiKey}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">Model ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-sm rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    value={config.modelId}
                                    onChange={(e) => handleChange('modelId', e.target.value)}
                                />
                            </div>
                        </section>

                        {/* Live API Specifics (Moved from Behavior) */}
                        <section className="grid grid-cols-2 gap-4">
                            <h3 className="col-span-2 text-[#ffd700] font-pixel text-[10px] uppercase mb-0 border-b border-gray-700 pb-1">
                                Live API Specifics
                            </h3>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700">
                                <span className="text-xs text-gray-300">Proactive Audio</span>
                                <button
                                    onClick={() => handleChange('proactiveAudio', !config.proactiveAudio)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.proactiveAudio ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.proactiveAudio ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700">
                                <span className="text-xs text-gray-300">Affective Dialog</span>
                                <button
                                    onClick={() => handleChange('affectiveDialog', !config.affectiveDialog)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.affectiveDialog ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.affectiveDialog ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700">
                                <span className="text-xs text-gray-300">Input Transcript</span>
                                <button
                                    onClick={() => handleChange('inputTranscription', !config.inputTranscription)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.inputTranscription ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.inputTranscription ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700">
                                <span className="text-xs text-gray-300">Output Transcript</span>
                                <button
                                    onClick={() => handleChange('outputTranscription', !config.outputTranscription)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.outputTranscription ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.outputTranscription ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700 col-span-2">
                                <span className="text-xs text-gray-300">Google Grounding</span>
                                <button
                                    onClick={() => handleChange('googleGrounding', !config.googleGrounding)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.googleGrounding ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.googleGrounding ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </section>

                        {/* Live API VAD Settings */}
                        <section className="space-y-3">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-1 border-b border-gray-700 pb-1">
                                Live API VAD Settings
                            </h3>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">End Sensitivity</label>
                                <select
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-xs rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    value={config.endSpeechSensitivity}
                                    onChange={(e) => handleChange('endSpeechSensitivity', e.target.value as any)}
                                >
                                    <option value="default">Default</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">Start Sensitivity</label>
                                <select
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-xs rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    value={config.startSpeechSensitivity}
                                    onChange={(e) => handleChange('startSpeechSensitivity', e.target.value as any)}
                                >
                                    <option value="default">Default</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </section>

                        {/* Client VAD Settings */}
                        <section className="space-y-3">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-2 border-b border-gray-700 pb-1">
                                Client VAD Settings
                            </h3>
                            <div className="flex items-center justify-between bg-[#162032] p-2 rounded border border-gray-700">
                                <span className="text-xs text-gray-300">Enable Client VAD</span>
                                <button
                                    onClick={() => handleChange('clientVAD', !config.clientVAD)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${config.clientVAD ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${config.clientVAD ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Silence Duration (ms)</span>
                                    <span className="text-[#ffd700] font-mono">{config.silenceDuration}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="2000" step="100"
                                    value={config.silenceDuration}
                                    onChange={(e) => handleChange('silenceDuration', parseInt(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Prefix Padding (ms)</span>
                                    <span className="text-[#ffd700] font-mono">{config.prefixPadding}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="2000" step="100"
                                    value={config.prefixPadding}
                                    onChange={(e) => handleChange('prefixPadding', parseInt(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Persona Studio */}
                        <section className="space-y-3">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-2 border-b border-gray-700 pb-1">
                                Persona Studio
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {PERSONAS.map((persona) => (
                                    <button
                                        key={persona.id}
                                        onClick={() => handleChange('selectedPersonaId', persona.id)}
                                        className={`flex flex-col items-center p-2 rounded border-2 transition-all ${config.selectedPersonaId === persona.id
                                            ? 'bg-blue-900/50 border-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                                            : 'bg-[#162032] border-gray-700 hover:border-gray-500'
                                            }`}
                                    >
                                        <span className="text-2xl mb-1">{persona.emoji}</span>
                                        <span className="text-[10px] font-bold text-gray-300">{persona.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">System Instructions</label>
                                <textarea
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-xs rounded p-2 h-20 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none resize-none font-mono"
                                    value={config.systemInstructions}
                                    onChange={(e) => handleChange('systemInstructions', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-display uppercase tracking-wider">Voice</label>
                                <select
                                    className="w-full bg-[#162032] border border-gray-600 text-white text-sm rounded p-2 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none"
                                    value={config.voice}
                                    onChange={(e) => handleChange('voice', e.target.value)}
                                >
                                    {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </section>

                        {/* Audio Engine */}
                        <section className="space-y-4">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-2 border-b border-gray-700 pb-1">
                                Audio Engine
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-300">Temperature</span>
                                        <span className="text-[#ffd700] font-mono">{config.temperature}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={config.temperature}
                                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Custom Capabilities (Moved from Model) */}
                        <section className="space-y-3">
                            <h3 className="text-[#ffd700] font-pixel text-[10px] uppercase mb-2 border-b border-gray-700 pb-1">
                                Custom Capabilities
                            </h3>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 border-2 border-gray-500 rounded-sm flex items-center justify-center ${config.alertBox ? 'bg-[#ffd700] border-[#ffd700]' : ''}`}>
                                        {config.alertBox && <div className="w-2 h-2 bg-black" />}
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white">Alert Box</span>
                                    <input type="checkbox" className="hidden" checked={config.alertBox} onChange={(e) => handleChange('alertBox', e.target.checked)} />
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 border-2 border-gray-500 rounded-sm flex items-center justify-center ${config.cssStyle ? 'bg-[#ffd700] border-[#ffd700]' : ''}`}>
                                        {config.cssStyle && <div className="w-2 h-2 bg-black" />}
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white">CSS Inject</span>
                                    <input type="checkbox" className="hidden" checked={config.cssStyle} onChange={(e) => handleChange('cssStyle', e.target.checked)} />
                                </label>
                            </div>
                        </section>

                    </div>
                )}
            </div>

            <div className="p-3 border-t-2 border-white bg-[#0a0f16] flex justify-end">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 border-2 border-white text-white font-pixel text-[10px] uppercase hover:bg-green-600 transition-colors shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                >
                    <Save size={14} />
                    Done
                </button>
            </div>
        </div>
    );
};

export default ConfigurationMenu;