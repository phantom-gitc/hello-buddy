const chunkingService = {
  /**
   * Splits text into manageable overlapping chunks for vector embedding
   * @param {string} text - Raw input text
   * @param {object} options
   * @param {number} options.chunkSize - Max words/chars per chunk
   * @param {number} options.overlap - Overlap size
   * @returns {Array<{ text: string, chunkIndex: number }>}
   */
  chunkText(text, { chunkSize = 400, overlap = 50 } = {}) {
    if (!text || typeof text !== 'string') return [];

    // Normalize whitespace
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    if (!cleanText) return [];

    const words = cleanText.split(' ');
    if (words.length <= chunkSize) {
      return [{ text: cleanText, chunkIndex: 0 }];
    }

    const chunks = [];
    let i = 0;
    let chunkIndex = 0;

    while (i < words.length) {
      const slice = words.slice(i, i + chunkSize);
      const chunkContent = slice.join(' ');

      chunks.push({
        text: chunkContent,
        chunkIndex,
      });

      chunkIndex++;
      i += chunkSize - overlap;
    }

    return chunks;
  },
};

module.exports = chunkingService;
