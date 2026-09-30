const logger = require('../../utils/logger');
const config = require('../../config/env');

const sttService = {
  /**
   * Transcribes audio buffer to text
   * @param {Buffer} audioBuffer
   * @param {string} mimeType
   * @returns {Promise<string>}
   */
  async transcribe(audioBuffer, mimeType = 'audio/webm') {
    if (!audioBuffer) return '';

    // Use Groq Whisper API (whisper-large-v3) for ultra-fast STT
    const apiKey = config.ai.groqApiKey;
    const url = 'https://api.groq.com/openai/v1/audio/transcriptions';

    if (apiKey && !apiKey.includes('dummy')) {
      try {
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: mimeType });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.text || '';
        }
      } catch (err) {
        logger.warn('STT API call error:', { error: err.message });
      }
    }

    // Mock transcript fallback in dev
    logger.info('[MOCK STT] Transcribing voice input');
    return 'This is a simulated transcript from voice input in development mode.';
  },
};

module.exports = sttService;
