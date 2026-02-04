/**
 * Audio Worklet Processor for capturing and processing audio
 * Performs RMS calculation and PCM16 conversion on the audio thread
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, _outputs, _parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const inputChannel = input[0];

      // Buffer the incoming audio
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i];

        // When buffer is full, process and send it
        if (this.bufferIndex >= this.bufferSize) {
          // 1. Calculate RMS for VAD
          let sumSquares = 0;
          for (let j = 0; j < this.bufferSize; j++) {
            sumSquares += this.buffer[j] * this.buffer[j];
          }
          const rms = Math.sqrt(sumSquares / this.bufferSize);

          // 2. Convert to PCM16
          const pcm16 = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            const s = Math.max(-1, Math.min(1, this.buffer[j]));
            // Convert to 16-bit PCM (signed)
            pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // 3. Send to main thread
          // We transfer the buffer to avoid copying
          this.port.postMessage({
            type: "audio",
            data: pcm16.buffer,
            rms: rms
          }, [pcm16.buffer]);

          // Reset buffer
          this.bufferIndex = 0;
        }
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor("audio-capture-processor", AudioCaptureProcessor);
