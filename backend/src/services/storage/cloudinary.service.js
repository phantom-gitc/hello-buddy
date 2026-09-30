const cloudinary = require('../../config/cloudinary');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');

const cloudinaryService = {
  /**
   * Uploads a file buffer to Cloudinary
   * @param {Buffer} buffer - File buffer from multer
   * @param {object} options
   * @param {string} options.folder - Destination folder in Cloudinary
   * @param {string} options.resourceType - 'auto' | 'image' | 'raw'
   * @param {string} options.filename - original filename
   */
  async uploadBuffer(buffer, { folder = 'general', resourceType = 'auto', filename = '' }) {
    if (!config.cloudinary.cloudName || config.cloudinary.cloudName === 'dummy_cloud') {
      logger.info(`[MOCK CLOUDINARY] Uploading file "${filename}" to folder "${folder}"`);
      const mockPublicId = `${folder}/${Date.now()}_${filename.replace(/\s+/g, '_')}`;
      return {
        url: `https://res.cloudinary.com/demo/image/upload/${mockPublicId}`,
        publicId: mockPublicId,
        resourceType: resourceType === 'raw' ? 'raw' : 'image',
        format: filename.split('.').pop() || 'dat',
        size: buffer.length,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `hellobuddy/${folder}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', { error: error.message });
            return reject(ApiError.internal('Failed to upload file to Cloudinary', 'UPLOAD_FAILED'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            size: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Deletes a file from Cloudinary by its publicId
   * @param {string} publicId
   * @param {string} resourceType
   */
  async deleteFile(publicId, resourceType = 'image') {
    if (!publicId) return;

    if (!config.cloudinary.cloudName || config.cloudinary.cloudName === 'dummy_cloud') {
      logger.info(`[MOCK CLOUDINARY] Deleting file publicId "${publicId}"`);
      return { result: 'ok' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result;
    } catch (error) {
      logger.error('Cloudinary delete error:', { error: error.message });
      throw ApiError.internal('Failed to delete file from Cloudinary', 'DELETE_FAILED');
    }
  },
};

module.exports = cloudinaryService;
