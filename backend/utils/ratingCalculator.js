import { firestore, db } from '../config/firebase.js';

// Update game's average rating
export const updateGameRating = async (gameId) => {
  try {
    // Get all reviews for the game (including null ratings for counting)
    const allReviewsSnapshot = await firestore.collection('reviews')
      .where('gameId', '==', gameId)
      .get();
    
    let totalRating = 0;
    let count = 0;
    
    // Filter and calculate only non-null ratings
    allReviewsSnapshot.forEach(doc => {
      const review = doc.data();
      // Check if rating exists and is a valid number between 1-5
      if (review.rating !== null && review.rating !== undefined && 
          typeof review.rating === 'number' && 
          review.rating >= 1 && review.rating <= 5) {
        totalRating += review.rating;
        count++;
      }
    });
    
    // Calculate average rating (rounded to 1 decimal place)
    const averageRating = count > 0 
      ? parseFloat((totalRating / count).toFixed(1)) 
      : 0;
    
    // Update game record with new rating
    await db.ref(`games/${gameId}`).update({
      averageRating,
      totalRatings: count
    });
    
    console.log(`✅ Updated rating for game ${gameId}: ${averageRating}/5 (${count} ratings)`);
    
    return { averageRating, totalRatings: count };
  } catch (error) {
    console.error('Update game rating error:', error);
    throw error;
  }
};