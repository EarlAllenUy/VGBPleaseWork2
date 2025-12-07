// Game Card Component
import { createStarRating, formatDate } from '../utils/helpers.js';

export const createGameCard = (game) => {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.dataset.gameId = game.id || game.gameId;
  
  const imageUrl = game.image || game.imageBase64 || 'images/placeholder.png';
  const rating = game.averageRating || 0;
  const totalRatings = game.totalRatings || 0;
  
  card.innerHTML = `
    <div class="game-image">
      <img src="${imageUrl}" alt="${game.title}" onerror="this.src='images/placeholder.png'">
      <span class="game-status ${game.upcoming ? 'upcoming' : 'released'}">
        ${game.upcoming ? 'Upcoming' : 'Released'}
      </span>
    </div>
    <div class="game-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-genre">${game.genre}</p>
      <p class="game-platform">${game.platform}</p>
      <div class="game-rating">
        <span class="stars">${createStarRating(rating)}</span>
        <span class="rating-text">${rating.toFixed(1)}/5 (${totalRatings})</span>
      </div>
      <p class="game-release">Release: ${formatDate(game.releaseDate)}</p>
    </div>
  `;
  
  card.addEventListener('click', () => {
    window.location.href = `game-detail.html?id=${game.id || game.gameId}`;
  });
  
  return card;
};

export const renderGameGrid = (games, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (games.length === 0) {
    container.innerHTML = '<p class="no-games">No games found</p>';
    return;
  }
  
  games.forEach(game => {
    container.appendChild(createGameCard(game));
  });
};