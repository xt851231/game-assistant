import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = forwardRef(({ width, height, activeTool, color, brushSize }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    // const [textInput, setTextInput] = useState(null); // { x, y, value } - TEXT TOOL DISABLED
    const [ctx, setCtx] = useState(null);

    // Initialize Canvas
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
        }
    }, [width, height]);

    // Update Context Styles
    useEffect(() => {
        if (ctx) {
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.fillStyle = color;
            ctx.font = `${brushSize * 5}px Arial`; // Scale text with brush size
        }
    }, [ctx, color, brushSize]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        clear: () => {
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                // setTextInput(null); // TEXT TOOL DISABLED
            }
        },
        getCanvas: () => canvasRef.current
    }));

    const startDrawing = (e) => {
        // TEXT TOOL DISABLED
        // if (activeTool === 'text') {
        //     handleTextClick(e);
        //     return;
        // }

        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e) => {
        if (!isDrawing || activeTool !== 'pen') return;

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            ctx.closePath();
            setIsDrawing(false);
        }
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            offsetX: (clientX - rect.left) * scaleX,
            offsetY: (clientY - rect.top) * scaleY
        };
    };

    /* TEXT TOOL DISABLED - Uncomment to re-enable
    const handleTextClick = (e) => {
        if (textInput) {
            // If pressing somewhere else while input is open, commit text
            commitText();
        } else {
            const { offsetX, offsetY } = getCoordinates(e);
            // Spawn input box
            setTextInput({ x: offsetX, y: offsetY, value: '' });
        }
    };

    const commitText = () => {
        if (textInput && textInput.value.trim()) {
            ctx.fillText(textInput.value, textInput.x, textInput.y + (brushSize * 5)); // Adjust baseline
            setTextInput(null);
        } else {
            setTextInput(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            commitText();
        }
    };
    */

    return (
        <div className="drawing-layer">
            <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* TEXT TOOL DISABLED - Uncomment to re-enable
            {textInput && (
                <input
                    type="text"
                    autoFocus
                    value={textInput.value}
                    onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onBlur={commitText}
                    style={{
                        position: 'absolute',
                        left: textInput.x,
                        top: textInput.y,
                        color: color,
                        fontSize: `${brushSize * 5}px`,
                        border: '1px dashed #ccc',
                        background: 'rgba(255,255,255,0.5)',
                        zIndex: 20
                    }}
                />
            )}
            */}
        </div>
    );
});

export default DrawingCanvas;
