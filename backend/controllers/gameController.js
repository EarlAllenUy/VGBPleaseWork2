import { db, firestore } from '../config/firebase.js';
import { uploadImageToStorage, deleteImageFromStorage, base64ToBuffer, validateImage } from '../utils/storageHelper.js';

// Get all games
export const getAllGames = async (req, res) => {
  try {
    const snapshot = await db.ref('games').once('value');
    const games = [];
    
    snapshot.forEach((child) => {
      games.push({ id: child.key, ...child.val() });
    });
    
    res.json(games);
  } catch (error) {
    console.error('Get all games error:', error);
    res.status(500).json({ error: 'Failed to retrieve games' });
  }
};

// Get single game by ID
export const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const gameSnapshot = await db.ref(`games/${gameId}`).once('value');
    const gameData = gameSnapshot.val();
    
    if (!gameData) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get reviews from Firestore
    const reviewsSnapshot = await firestore.collection('reviews')
      .where('gameId', '==', gameId)
      .orderBy('dateTimePosted', 'desc')
      .get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ reviewId: doc.id, ...doc.data() });
    });
    
    res.json({ game: { id: gameId, ...gameData }, reviews });
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve game' });
  }
};

// Search games by title
export const searchGames = async (req, res) => {
  try {
    const { title } = req.query;
    
    if (!title) {
      return res.status(400).json({ error: 'Title parameter required' });
    }
    
    const snapshot = await db.ref('games').once('value');
    const games = [];
    
    snapshot.forEach((child) => {
      const game = child.val();
      if (game.title && game.title.toLowerCase().includes(title.toLowerCase())) {
        games.push({ id: child.key, ...game });
      }
    });
    
    res.json(games);
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ error: 'Failed to search games' });
  }
};

// Multi-criteria filter
export const filterGames = async (req, res) => {
  try {
    const { platform, genre, status, minRating, startDate, endDate } = req.query;
    
    const snapshot = await db.ref('games').once('value');
    let games = [];
    
    snapshot.forEach((child) => {
      games.push({ id: child.key, ...child.val() });
    });
    
    // Apply filters
    if (platform) {
      games = games.filter(game => 
        game.platform && game.platform.toLowerCase().includes(platform.toLowerCase())
      );
    }
    
    if (genre) {
      games = games.filter(game => 
        game.genre && game.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }
    
    if (status === 'upcoming') {
      games = games.filter(game => game.upcoming === true);
    } else if (status === 'released') {
      games = games.filter(game => game.released === true);
    }
    
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      games = games.filter(game => 
        game.averageRating && game.averageRating >= minRatingNum
      );
    }
    
    if (startDate && endDate) {
      games = games.filter(game => 
        game.releaseDate && 
        game.releaseDate >= startDate && 
        game.releaseDate <= endDate
      );
    }
    
    res.json(games);
  } catch (error) {
    console.error('Filter games error:', error);
    res.status(500).json({ error: 'Failed to filter games' });
  }
};

// Add game (Admin only) - Supports both file upload and Base64
export const addGame = async (req, res) => {
  try {
    const { 
      gameId, 
      title, 
      description, 
      releaseDate, 
      platform, 
      genre, 
      upcoming, 
      released,
      imageBase64  // Base64 string from frontend (fallback)
    } = req.body;
    
    // Validate required fields
    if (!gameId || !title) {
      return res.status(400).json({ 
        error: 'gameId and title are required' 
      });
    }
    
    let imageUrl = '';
    
    // Handle file upload (multer)
    if (req.file) {
      const validation = validateImage(req.file.mimetype, req.file.size);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const fileName = `${gameId}.${req.file.mimetype.split('/')[1]}`;
      imageUrl = await uploadImageToStorage(
        req.file.buffer, 
        fileName, 
        req.file.mimetype
      );
    }
    // Handle Base64 image (backward compatibility)
    else if (imageBase64) {
      try {
        const { buffer, mimeType } = base64ToBuffer(imageBase64);
        const validation = validateImage(mimeType, buffer.length);
        
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }
        
        const fileName = `${gameId}.${mimeType.split('/')[1]}`;
        imageUrl = await uploadImageToStorage(buffer, fileName, mimeType);
      } catch (error) {
        return res.status(400).json({ 
          error: `Invalid image format: ${error.message}` 
        });
      }
    }
    
    const gameData = {
      gameId,
      title,
      description: description || '',
      releaseDate: releaseDate || '',
      platform: platform || '',
      genre: genre || '',
      image: imageUrl,  // Store Firebase Storage URL
      imageBase64: imageBase64 || '',  // Keep Base64 for backward compatibility
      upcoming: upcoming === 'true' || upcoming === true,
      released: released === 'true' || released === true,
      averageRating: 0,
      totalRatings: 0
    };
    
    await db.ref(`games/${gameId}`).set(gameData);
    
    res.status(201).json({ 
      message: 'Game added successfully', 
      gameId,
      imageUrl: imageUrl || 'No image provided'
    });
  } catch (error) {
    console.error('Add game error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to add game' 
    });
  }
};

// Update game (Admin only) - Supports both file upload and Base64
export const updateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { 
      title, 
      description, 
      releaseDate, 
      platform, 
      genre, 
      upcoming, 
      released,
      imageBase64
    } = req.body;
    
    // Check if game exists
    const gameSnapshot = await db.ref(`games/${gameId}`).once('value');
    if (!gameSnapshot.exists()) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate;
    if (platform !== undefined) updateData.platform = platform;
    if (genre !== undefined) updateData.genre = genre;
    if (upcoming !== undefined) {
      updateData.upcoming = upcoming === 'true' || upcoming === true;
    }
    if (released !== undefined) {
      updateData.released = released === 'true' || released === true;
    }
    
    // Handle image update - file upload (multer) takes priority
    if (req.file) {
      // Delete old image if exists
      const oldGameData = gameSnapshot.val();
      if (oldGameData.image) {
        try {
          const oldFileName = oldGameData.image.split('/').pop();
          await deleteImageFromStorage(`game-images/${oldFileName}`);
        } catch (error) {
          console.warn('Could not delete old image:', error.message);
        }
      }
      
      // Upload new image
      const validation = validateImage(req.file.mimetype, req.file.size);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const fileName = `${gameId}.${req.file.mimetype.split('/')[1]}`;
      const imageUrl = await uploadImageToStorage(
        req.file.buffer, 
        fileName, 
        req.file.mimetype
      );
      updateData.image = imageUrl;
    }
    // Handle Base64 image update
    else if (imageBase64) {
      try {
        // Delete old image
        const oldGameData = gameSnapshot.val();
        if (oldGameData.image) {
          try {
            const oldFileName = oldGameData.image.split('/').pop();
            await deleteImageFromStorage(`game-images/${oldFileName}`);
          } catch (error) {
            console.warn('Could not delete old image:', error.message);
          }
        }
        
        const { buffer, mimeType } = base64ToBuffer(imageBase64);
        const validation = validateImage(mimeType, buffer.length);
        
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }
        
        const fileName = `${gameId}.${mimeType.split('/')[1]}`;
        const imageUrl = await uploadImageToStorage(buffer, fileName, mimeType);
        updateData.image = imageUrl;
        updateData.imageBase64 = imageBase64;  // Keep for backward compatibility
      } catch (error) {
        return res.status(400).json({ 
          error: `Invalid image format: ${error.message}` 
        });
      }
    }
    
    await db.ref(`games/${gameId}`).update(updateData);
    
    res.json({ message: 'Game updated successfully' });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update game' 
    });
  }
};

// Delete game (Admin only) - Includes image deletion from Storage
export const deleteGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Check if game exists
    const gameSnapshot = await db.ref(`games/${gameId}`).once('value');
    if (!gameSnapshot.exists()) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const gameData = gameSnapshot.val();
    
    // Delete image from Storage if exists
    if (gameData.image) {
      try {
        // Extract filename from URL
        const imageUrlParts = gameData.image.split('/');
        const fileName = imageUrlParts[imageUrlParts.length - 1];
        await deleteImageFromStorage(`game-images/${fileName}`);
      } catch (error) {
        console.warn('Could not delete image from Storage:', error.message);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete all reviews for this game
    const reviewsSnapshot = await firestore.collection('reviews')
      .where('gameId', '==', gameId)
      .get();
    
    const batch = firestore.batch();
    reviewsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    if (!reviewsSnapshot.empty) {
      await batch.commit();
    }
    
    // Delete favorites
    const favoritesSnapshot = await db.ref('favorites')
      .orderByChild('gameId')
      .equalTo(gameId)
      .once('value');
    
    const favoriteUpdates = {};
    favoritesSnapshot.forEach(child => {
      favoriteUpdates[child.key] = null;
    });
    
    if (Object.keys(favoriteUpdates).length > 0) {
      await db.ref('favorites').update(favoriteUpdates);
    }
    
    // Delete game
    await db.ref(`games/${gameId}`).remove();
    
    res.json({ message: 'Game and related data deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete game' 
    });
  }
};