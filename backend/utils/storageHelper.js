import { storage } from '../config/firebase.js';

/**
 * Upload image to Firebase Storage and return public URL
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} fileName - Name for the file (e.g., 'game1.jpg')
 * @param {string} mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadImageToStorage = async (imageBuffer, fileName, mimeType) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(`game-images/${fileName}`);
    
    // Upload the file
    await file.save(imageBuffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000' // Cache for 1 year
      }
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Firebase Storage
 * @param {string} filePath - Path to the file to delete (e.g., 'game-images/game1.jpg' or just 'game1.jpg')
 * @returns {Promise<void>}
 */
export const deleteImageFromStorage = async (filePath) => {
  try {
    const bucket = storage.bucket();
    
    // Ensure path includes 'game-images/' prefix
    const fullPath = filePath.startsWith('game-images/') 
      ? filePath 
      : `game-images/${filePath}`;
    
    const file = bucket.file(fullPath);
    
    // Check if file exists before deleting
    const [exists] = await file.exists();
    
    if (exists) {
      await file.delete();
      console.log(`✅ Deleted image: ${fullPath}`);
    } else {
      console.log(`⚠️ Image not found: ${fullPath}`);
    }
  } catch (error) {
    console.error('Error deleting image from Storage:', error);
    // Don't throw error - file might already be deleted
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Convert Base64 string to buffer
 * @param {string} base64String - Base64 encoded image string
 * @returns {Object} Object with buffer and mimeType
 */
export const base64ToBuffer = (base64String) => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Extract MIME type from base64 string
    const mimeTypeMatch = base64String.match(/^data:image\/(\w+);base64,/);
    const mimeType = mimeTypeMatch ? `image/${mimeTypeMatch[1]}` : 'image/jpeg';
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    return { buffer, mimeType };
  } catch (error) {
    throw new Error(`Invalid base64 image: ${error.message}`);
  }
};

/**
 * Validate image file
 * @param {string} mimeType - MIME type of the file
 * @param {number} fileSize - File size in bytes
 * @returns {Object} Validation result with isValid and error message
 */
export const validateImage = (mimeType, fileSize) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed.'
    };
  }
  
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: 'Image too large. Maximum size is 5MB.'
    };
  }
  
  return { isValid: true };
};

