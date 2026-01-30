import React, { useRef, useEffect, useState } from 'react';
import { Pen, Eraser, Pipette, Trash2, Maximize2 } from 'lucide-react';

interface StageProps {
    tool: 'pen' | 'eraser';
    color: string;
    brushSize: number;
    onClear: () => void;
    videoStream: MediaStream | null;
    onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const Stage: React.FC<StageProps> = ({ tool, color, brushSize, onClear, videoStream, onCanvasReady }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Expose canvas to parent
    useEffect(() => {
        if (canvasRef.current && onCanvasReady) {
            onCanvasReady(canvasRef.current);
        }
    }, [onCanvasReady]);

    // Sync video stream
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    // Sync canvas size with ResizeObserver
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // We observe the container, so use its dimensions
                const { width, height } = entry.contentRect;

                // Only act if dimensions have actually changed to avoid loop/flicker
                // Note: We update canvas resolution (width/height attributes), not style.
                if (canvas.width !== width || canvas.height !== height) {

                    // Save current content
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                        tempCtx.drawImage(canvas, 0, 0);
                    }

                    // Resize
                    canvas.width = width;
                    canvas.height = height;

                    // Restore content
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(tempCanvas, 0, 0);

                        // Restore context properties
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,0)' : (color || '#ffd700');
                        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                        ctx.lineWidth = brushSize || 4;
                        contextRef.current = ctx;
                    }
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [tool, color, brushSize]);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,0)' : color;
            contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            contextRef.current.lineWidth = brushSize;
        }
    }, [color, brushSize, tool]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: React.MouseEvent) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const stopDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    useEffect(() => {
        const handleClear = () => {
            const canvas = canvasRef.current;
            if (canvas && contextRef.current) {
                contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        document.addEventListener('STAGE_CLEAR', handleClear);
        return () => document.removeEventListener('STAGE_CLEAR', handleClear);
    }, []);

    return (
        <div ref={containerRef} className="flex-1 relative rpg-window rpg-window-gold overflow-hidden shadow-2xl flex flex-col justify-center mb-0 group">
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 size-6 border-t-4 border-l-4 border-[#ffd700] z-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 size-6 border-t-4 border-r-4 border-[#ffd700] z-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 size-6 border-b-4 border-l-4 border-[#ffd700] z-20 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 size-6 border-b-4 border-r-4 border-[#ffd700] z-20 pointer-events-none"></div>

            {/* Video Content */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Drawing Layer */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`absolute inset-0 z-30 cursor-crosshair w-full h-full block ${tool === 'eraser' ? 'cursor-cell' : ''}`}
            />
        </div>
    );
};

export default Stage;