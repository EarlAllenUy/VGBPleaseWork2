import { db } from '../config/firebase.js';

// Get user's favorites
export const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db.ref('favorites')
      .orderByChild('userId')
      .equalTo(userId)
      .once('value');
    
    const favorites = [];
    
    // Use forEach for async operations
    const promises = [];
    snapshot.forEach((childSnapshot) => {
      const child = childSnapshot.val();
      promises.push(
        db.ref(`games/${child.gameId}`).once('value').then((gameSnapshot) => {
          const gameData = gameSnapshot.val();
          
          if (gameData) {
            favorites.push({
              favoriteId: child.userId + '_' + child.gameId,
              userId: child.userId,
              gameId: child.gameId,
              dateAdded: child.dateAdded,
              game: { id: child.gameId, ...gameData }
            });
          }
        })
      );
    });
    
    await Promise.all(promises);
    
    res.json(favorites);
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ error: 'Failed to retrieve favorites' });
  }
};

// Add favorite
export const addFavorite = async (req, res) => {
  try {
    const { userId, gameId } = req.body;
    
    if (!userId || !gameId) {
      return res.status(400).json({ 
        error: 'userId and gameId are required' 
      });
    }
    
    // Check if game exists
    const gameSnapshot = await db.ref(`games/${gameId}`).once('value');
    if (!gameSnapshot.exists()) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if already favorited
    const favoriteId = `${userId}_${gameId}`;
    const existingFavorite = await db.ref(`favorites/${favoriteId}`).once('value');
    
    if (existingFavorite.exists()) {
      return res.status(400).json({ 
        error: 'Game already in favorites' 
      });
    }
    
    // Add favorite
    const favoriteData = {
      userId,
      gameId,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    await db.ref(`favorites/${favoriteId}`).set(favoriteData);
    
    res.status(201).json({ 
      message: 'Game added to favorites', 
      favoriteId 
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

// Remove favorite
export const removeFavorite = async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    
    const favoriteId = `${userId}_${gameId}`;
    const favoriteSnapshot = await db.ref(`favorites/${favoriteId}`).once('value');
    
    if (!favoriteSnapshot.exists()) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    await db.ref(`favorites/${favoriteId}`).remove();
    
    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

// Check if game is favorited by user
export const checkFavorite = async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    
    const favoriteId = `${userId}_${gameId}`;
    const favoriteSnapshot = await db.ref(`favorites/${favoriteId}`).once('value');
    
    res.json({ isFavorited: favoriteSnapshot.exists() });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
};