const pdfParse = require('pdf-parse');
const logger = require('../../utils/logger');

const resumeParser = {
  /**
   * Extracts raw text from a PDF buffer
   * @param {Buffer} buffer
   * @returns {Promise<string>}
   */
  async extractTextFromPdf(buffer) {
    try {
      const data = await pdfParse(buffer);
      const cleanText = data.text
        .replace(/\r\n/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      return cleanText;
    } catch (error) {
      logger.error('Failed to parse PDF text:', { error: error.message });
      throw new Error(`PDF parsing error: ${error.message}`);
    }
  },

  /**
   * Quick heuristic extraction of obvious contact/keywords
   */
  extractBasicMetadata(text) {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    return {
      detectedEmail: emailMatch ? emailMatch[0] : null,
      detectedPhone: phoneMatch ? phoneMatch[0] : null,
    };
  },
};

module.exports = resumeParser;
