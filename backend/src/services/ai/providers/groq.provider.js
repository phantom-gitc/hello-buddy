const config = require('../../../config/env');
const logger = require('../../../utils/logger');

class GroqProvider {
  constructor() {
    this.name = 'groq';
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.defaultModel = config.ai.groqModel || 'openai/gpt-oss-120b';
  }

  isAvailable() {
    return Boolean(config.ai.groqApiKey && !config.ai.groqApiKey.includes('dummy'));
  }

  /**
   * Generates standard text completion
   */
  async generateText({ messages, model, temperature = 0.7, maxTokens = 1500, responseFormat }) {
    if (!this.isAvailable()) {
      logger.warn('Groq API key not set or dummy. Returning fallback response.');
      return this._mockResponse(messages);
    }

    try {
      const payload = {
        model: model || this.defaultModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (responseFormat === 'json') {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.groqApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      logger.error('Groq provider error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Generates structured JSON output and parses it safely
   */
  async generateStructuredOutput({ messages, model, schemaDescription }) {
    const systemPromptModifier = `\nYou MUST respond ONLY with a valid JSON object matching this schema description:\n${schemaDescription}\nDo not include backticks, markdown markers, or commentary outside the JSON.`;

    const adjustedMessages = [...messages];
    adjustedMessages[0] = {
      ...adjustedMessages[0],
      content: (adjustedMessages[0]?.content || '') + systemPromptModifier,
    };

    const rawText = await this.generateText({
      messages: adjustedMessages,
      model,
      temperature: 0.2, // Low temperature for high precision JSON
      responseFormat: 'json',
    });

    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      logger.error('Failed to parse structured JSON from Groq output:', { rawText, error: err.message });
      throw new Error('LLM output was not valid JSON');
    }
  }

  /**
   * Streams completion chunks via an async callback
   */
  async streamText({ messages, model, onChunk, onDone, onError }) {
    if (!this.isAvailable()) {
      const mockText = "This is a simulated AI response running in local development mode without external API keys. Configure GROQ_API_KEY in your .env file to enable live LLM generation.";
      for (const word of mockText.split(' ')) {
        await new Promise((r) => setTimeout(r, 40));
        onChunk(word + ' ');
      }
      if (onDone) onDone();
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.groqApiKey}`,
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq stream failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              if (onDone) onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) onChunk(delta);
            } catch (e) {
              // Ignore partial stream parse errors
            }
          }
        }
      }

      if (onDone) onDone();
    } catch (error) {
      logger.error('Groq streaming error:', { error: error.message });
      if (onError) onError(error);
    }
  }

  _mockResponse(messages) {
    const userMsg = messages[messages.length - 1]?.content || '';
    return `[Mock AI Response for: "${userMsg.slice(0, 50)}..."] Live AI capability is configured with Groq (Qwen) & Google Gemini. Please add valid API keys in .env.`;
  }
}

module.exports = new GroqProvider();
