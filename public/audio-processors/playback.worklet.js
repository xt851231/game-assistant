/**
 * Audio Playback Worklet Processor for playing PCM audio
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];

    this.port.onmessage = (event) => {
      if (event.data === "interrupt") {
        // Clear the queue on interrupt
        this.audioQueue = [];
      } else {
        // Assume data is Int16Array (PCM16) or Float32Array
        // We'll handle conversion in process() if needed
        const data = event.data;
        if (data instanceof Int16Array || data instanceof Float32Array) {
           this.audioQueue.push(data);
        }
      }
    };
  }

  process(inputs, outputs, _parameters) {
    const output = outputs[0];
    if (output.length === 0) return true;

    const channel = output[0];
    let outputIndex = 0;

    // Fill the output buffer from the queue
    while (outputIndex < channel.length && this.audioQueue.length > 0) {
      const currentBuffer = this.audioQueue[0];

      if (!currentBuffer || currentBuffer.length === 0) {
        this.audioQueue.shift();
        continue;
      }

      const remainingOutput = channel.length - outputIndex;
      const remainingBuffer = currentBuffer.length;
      const copyLength = Math.min(remainingOutput, remainingBuffer);

      // Copy audio data to output (converting to Float32 if necessary)
      if (currentBuffer instanceof Int16Array) {
        for (let i = 0; i < copyLength; i++) {
          // Convert PCM16 to Float32 [-1.0, 1.0]
          channel[outputIndex++] = currentBuffer[i] / 32768;
        }
      } else {
        // Already Float32
        for (let i = 0; i < copyLength; i++) {
          channel[outputIndex++] = currentBuffer[i];
        }
      }

      // Update or remove the current buffer
      if (copyLength < remainingBuffer) {
        this.audioQueue[0] = currentBuffer.subarray(copyLength);
      } else {
        this.audioQueue.shift();
      }
    }

    // Fill remaining output with silence
    while (outputIndex < channel.length) {
      channel[outputIndex++] = 0;
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
