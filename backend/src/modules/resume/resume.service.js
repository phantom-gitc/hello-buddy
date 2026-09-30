const Resume = require('./resume.model');
const resumeParser = require('./resume.parser');
const cloudinaryService = require('../../services/storage/cloudinary.service');
const aiService = require('../../services/ai/ai.service');
const ragService = require('../../services/rag/rag.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const resumeService = {
  /**
   * Uploads resume file and schedules background parsing, AI analysis & RAG ingestion
   */
  async uploadResume(userId, file) {
    if (!file) {
      throw ApiError.badRequest('Resume file is required', 'FILE_MISSING');
    }

    // 1. Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'resumes',
      resourceType: 'raw',
      filename: file.originalname,
    });

    // 2. Create MongoDB entry
    const resume = await Resume.create({
      userId,
      filename: file.originalname,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      fileSize: uploadResult.size,
      format: uploadResult.format,
      status: 'UPLOADED',
    });

    // 3. Process asynchronously without blocking response
    setImmediate(async () => {
      try {
        await this.processResumePipeline(resume._id, file.buffer);
      } catch (err) {
        logger.error(`Async resume processing failed for resume ${resume._id}:`, { error: err.message });
      }
    });

    return resume;
  },

  /**
   * Executes background pipeline: extraction -> AI analysis -> RAG ingestion
   */
  async processResumePipeline(resumeId, buffer) {
    const resume = await Resume.findById(resumeId);
    if (!resume) return;

    try {
      // Step A: PDF Text Extraction
      resume.status = 'PARSING';
      await resume.save();

      let text = resume.extractedText;
      if (!text && buffer) {
        text = await resumeParser.extractTextFromPdf(buffer);
        resume.extractedText = text;
      }
      resume.status = 'PARSED';
      await resume.save();

      // Step B: AI Resume Analysis
      resume.status = 'ANALYZING';
      await resume.save();

      const aiAnalysis = await aiService.analyzeResume(text);
      resume.parsedData = aiAnalysis;
      resume.status = 'ANALYZED';
      await resume.save();

      // Step C: Chunking & Qdrant RAG Ingestion
      await ragService.ingestDocument({
        userId: resume.userId,
        text,
        sourceType: 'resume',
        sourceId: resume._id,
      });

      resume.ingestedInQdrant = true;
      await resume.save();

      logger.info(`Resume ${resumeId} pipeline completed successfully.`);
    } catch (error) {
      resume.status = 'FAILED';
      resume.errorMessage = error.message;
      await resume.save();
      throw error;
    }
  },

  /**
   * Lists all resumes belonging to user
   */
  async getResumes(userId) {
    return Resume.find({ userId }).sort({ createdAt: -1 });
  },

  /**
   * Retrieves single resume ensuring ownership
   */
  async getResumeById(userId, resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      throw ApiError.notFound('Resume not found', 'RESUME_NOT_FOUND');
    }
    return resume;
  },

  /**
   * Retrieves analysis data of resume
   */
  async getResumeAnalysis(userId, resumeId) {
    const resume = await this.getResumeById(userId, resumeId);
    return {
      status: resume.status,
      parsedData: resume.parsedData,
      ingestedInQdrant: resume.ingestedInQdrant,
    };
  },

  /**
   * Manually re-triggers AI analysis on an existing parsed resume
   */
  async triggerAnalysis(userId, resumeId) {
    const resume = await this.getResumeById(userId, resumeId);
    if (!resume.extractedText) {
      throw ApiError.badRequest('Resume text has not been extracted yet', 'TEXT_NOT_EXTRACTED');
    }

    setImmediate(async () => {
      try {
        resume.status = 'ANALYZING';
        await resume.save();

        const aiAnalysis = await aiService.analyzeResume(resume.extractedText);
        resume.parsedData = aiAnalysis;
        resume.status = 'ANALYZED';
        await resume.save();
      } catch (err) {
        logger.error(`Re-analysis failed for resume ${resumeId}:`, { error: err.message });
      }
    });

    return { message: 'Resume analysis re-triggered in background' };
  },

  /**
   * Deletes resume from Cloudinary, Qdrant vectors, and MongoDB
   */
  async deleteResume(userId, resumeId) {
    const resume = await this.getResumeById(userId, resumeId);

    // Delete from Cloudinary
    await cloudinaryService.deleteFile(resume.publicId, 'raw').catch(() => {});

    // Delete vectors from Qdrant
    await ragService.removeSourceVectors(userId, resume._id).catch(() => {});

    // Delete from MongoDB
    await Resume.findByIdAndDelete(resumeId);

    return { message: 'Resume deleted successfully' };
  },
};

module.exports = resumeService;
