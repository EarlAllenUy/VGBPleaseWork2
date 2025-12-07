import { firestore, db } from '../config/firebase.js';
import { updateGameRating } from '../utils/ratingCalculator.js';

// Get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const snapshot = await firestore.collection('reviews')
      .orderBy('dateTimePosted', 'desc')
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ reviewId: doc.id, ...doc.data() });
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

// Get reviews by game ID
export const getReviewsByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const snapshot = await firestore.collection('reviews')
      .where('gameId', '==', gameId)
      .orderBy('dateTimePosted', 'desc')
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ reviewId: doc.id, ...doc.data() });
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews by game error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

// Get reviews by user ID
export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await firestore.collection('reviews')
      .where('userId', '==', userId)
      .orderBy('dateTimePosted', 'desc')
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ reviewId: doc.id, ...doc.data() });
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews by user error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

// Add review
export const addReview = async (req, res) => {
  try {
    const { userId, gameId, text, rating } = req.body;
    
    // Validate input
    if (!text && !rating) {
      return res.status(400).json({ 
        error: 'Must provide either text, rating, or both' 
      });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Check if game exists
    const gameSnapshot = await db.ref(`games/${gameId}`).once('value');
    if (!gameSnapshot.exists()) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Add review
    const reviewData = {
      userId,
      gameId,
      text: text || null,
      rating: rating ? parseInt(rating) : null,
      dateTimePosted: new Date().toISOString()
    };
    
    const reviewRef = await firestore.collection('reviews').add(reviewData);
    
    // Update game rating if rating was provided
    if (rating) {
      await updateGameRating(gameId);
    }
    
    res.status(201).json({ 
      message: 'Review added successfully', 
      reviewId: reviewRef.id 
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, text, rating } = req.body;
    
    // Get review
    const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    
    // Check ownership
    if (reviewData.userId !== userId) {
      return res.status(403).json({ 
        error: 'User can only edit their own reviews' 
      });
    }
    
    // Validate input
    if (!text && !rating) {
      return res.status(400).json({ 
        error: 'Must provide either text, rating, or both' 
      });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Update review
    const updateData = {
      text: text || null,
      rating: rating ? parseInt(rating) : null
    };
    
    await firestore.collection('reviews').doc(reviewId).update(updateData);
    
    // Recalculate rating if changed
    if (rating !== reviewData.rating) {
      await updateGameRating(reviewData.gameId);
    }
    
    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete review (users can delete their own, admins can delete any)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, isAdmin } = req.body;
    
    const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    
    // Check permissions - user must own the review OR be admin
    const isOwner = reviewData.userId === userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ 
        error: 'User can only delete their own reviews' 
      });
    }
    
    const gameId = reviewData.gameId;
    const hadRating = reviewData.rating !== null;
    
    // Delete review
    await firestore.collection('reviews').doc(reviewId).delete();
    
    // Update game rating if review had a rating
    if (hadRating) {
      await updateGameRating(gameId);
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Get all reviews for admin moderation (includes user and game details)
export const getAllReviewsForAdmin = async (req, res) => {
  try {
    const snapshot = await firestore.collection('reviews')
      .orderBy('dateTimePosted', 'desc')
      .get();
    
    const reviews = [];
    
    // Get user and game details for each review
    for (const doc of snapshot.docs) {
      const reviewData = doc.data();
      
      // Get user data
      let userData = null;
      try {
        const userSnapshot = await db.ref(`users/${reviewData.userId}`).once('value');
        userData = userSnapshot.val();
      } catch (error) {
        console.warn(`Could not fetch user data for ${reviewData.userId}`);
      }
      
      // Get game data
      let gameData = null;
      try {
        const gameSnapshot = await db.ref(`games/${reviewData.gameId}`).once('value');
        gameData = gameSnapshot.val();
      } catch (error) {
        console.warn(`Could not fetch game data for ${reviewData.gameId}`);
      }
      
      reviews.push({
        reviewId: doc.id,
        ...reviewData,
        user: userData ? {
          userId: userData.userId,
          username: userData.username,
          email: userData.email
        } : null,
        game: gameData ? {
          gameId: gameData.gameId,
          title: gameData.title,
          image: gameData.image || gameData.imageBase64 || null
        } : null
      });
    }
    
    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews for admin error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

// Delete review by admin (for moderation)
export const deleteReviewByAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();
    
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const reviewData = reviewDoc.data();
    const gameId = reviewData.gameId;
    const hadRating = reviewData.rating !== null;
    
    // Delete review
    await firestore.collection('reviews').doc(reviewId).delete();
    
    // Update game rating if review had a rating
    if (hadRating) {
      await updateGameRating(gameId);
    }
    
    res.json({ 
      message: 'Review deleted successfully by admin',
      deletedReview: {
        reviewId,
        gameId,
        userId: reviewData.userId
      }
    });
  } catch (error) {
    console.error('Delete review by admin error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};