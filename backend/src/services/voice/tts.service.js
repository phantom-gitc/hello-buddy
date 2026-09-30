const config = require('../../config/env');
const logger = require('../../utils/logger');

let kokoroTTSInstance = null;
let isInitializing = false;

const ttsService = {
  /**
   * Lazily loads and caches the Kokoro-js ONNX model instance
   */
  async getKokoroTTSInstance() {
    if (kokoroTTSInstance) return kokoroTTSInstance;
    if (isInitializing) {
      // Wait for existing load
      while (isInitializing) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return kokoroTTSInstance;
    }

    try {
      isInitializing = true;
      const { KokoroTTS } = require('kokoro-js');
      logger.info('Initializing Kokoro-js TTS model (onnx-community/Kokoro-82M-ONNX, q8)...');
      kokoroTTSInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
        dtype: 'q8',
      });
      logger.info('Kokoro-js TTS model loaded successfully');
      return kokoroTTSInstance;
    } catch (error) {
      logger.warn(`Failed to initialize in-process kokoro-js: ${error.message}`);
      return null;
    } finally {
      isInitializing = false;
    }
  },

  /**
   * Synthesizes text to speech audio buffer using kokoro-js or Kokoro API
   * @param {string} text - Text to synthesize
   * @param {object} options
   * @param {string} options.voice - e.g. 'af_heart', 'am_adam', 'af_bella'
   * @param {number} options.speed - playback speed (default 1.0)
   * @returns {Promise<Buffer|ArrayBuffer>}
   */
  async synthesize(text, { voice = 'af_heart', speed = 1.0 } = {}) {
    if (!text) return null;

    // 1. Try local in-process kokoro-js package
    try {
      const tts = await this.getKokoroTTSInstance();
      if (tts) {
        const audio = await tts.generate(text.slice(0, 2000), {
          voice: voice || 'af_heart',
          speed: speed || 1.0,
        });

        // audio.toBlob() or audio.toBuffer() or audio.audio Float32Array / WAV
        if (typeof audio.toBuffer === 'function') {
          return audio.toBuffer();
        } else if (typeof audio.toBlob === 'function') {
          const blob = await audio.toBlob();
          return Buffer.from(await blob.arrayBuffer());
        }
        return audio;
      }
    } catch (err) {
      logger.warn('In-process kokoro-js generation error, trying HTTP API:', { error: err.message });
    }

    // 2. Try external Kokoro HTTP API if configured
    if (config.voice.kokoroApiUrl) {
      try {
        const response = await fetch(`${config.voice.kokoroApiUrl}/audio/speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'kokoro',
            input: text.slice(0, 4000),
            voice: voice || 'af_heart',
            speed,
          }),
        });

        if (response.ok) {
          return await response.arrayBuffer();
        }
      } catch (err) {
        logger.warn('Kokoro HTTP API call failed:', { error: err.message });
      }
    }

    // 3. Dev Fallback
    logger.info('[MOCK TTS] Synthesized mock audio buffer for text:', text.slice(0, 50));
    return Buffer.from('mock-audio-data');
  },
};

module.exports = ttsService;
