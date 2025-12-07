import { initAuth, login, register, logout, getUserRole, getCurrentUserData, isAdmin } from './services/auth.js';
import { gameAPI, reviewAPI, favoriteAPI } from './services/api.js';
import { createFilterBar } from './components/filterBar.js';
import { renderGameGrid, createGameCard } from './components/gameCard.js';
import { initCalendar } from './components/calendar.js';
import { displayReviews } from './components/reviewForm.js';
import { showMessage, showError, showLoading, formatDate } from './utils/helpers.js';

// Current date for filtering (Dec 7, 2025 as per guide)
const CURRENT_DATE = new Date('2025-12-07');

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 VGB Frontend initialized');
  
  // Initialize authentication
  await initAuth();
  
  // Update welcome message with username
  updateWelcomeMessage();
  
  // Check current page and initialize
  const currentPage = window.location.pathname.split('/').pop();
  
  // Route to appropriate page handler
  if (currentPage === 'index.html' || currentPage === '' || currentPage.includes('index') && !currentPage.includes('user') && !currentPage.includes('admin')) {
    initGuestHomePage();
  } else if (currentPage.includes('user_index')) {
    initUserHomePage();
  } else if (currentPage.includes('admin_index')) {
    initAdminHomePage();
  } else if (currentPage.includes('calendar')) {
    initCalendarPage();
  } else if (currentPage.includes('reviews')) {
    initReviewsPage();
  } else if (currentPage.includes('my-favorites')) {
    initMyFavoritesPage();
  } else if (currentPage.includes('my-reviews')) {
    initMyReviewsPage();
  }
  
  // Setup auth buttons
  setupAuthButtons();
  setupNavigationButtons();
});

// Update welcome message
function updateWelcomeMessage() {
  const welcomeElement = document.getElementById('welcomeMessage');
  if (welcomeElement) {
    const userData = getCurrentUserData();
    if (userData && userData.username) {
      welcomeElement.textContent = `Welcome, ${userData.username}!`;
    } else if (userData && isAdmin()) {
      welcomeElement.textContent = 'Welcome, Admin!';
    }
  }
}

// ============================================================================
// GUEST HOME PAGE
// ============================================================================
const initGuestHomePage = async () => {
  createFilterBar('filter-container');
  
  // Load all games by default
  try {
    showLoading(true);
    const games = await gameAPI.getAll();
    
    // Show featured games (top 10 by rating)
    const featuredGames = [...games]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10);
    
    renderGameGrid(featuredGames, 'games-container');
    
    // Setup featured games carousel (auto-scroll every 5 seconds)
    setupFeaturedCarousel(featuredGames);
  } catch (error) {
    showError('Failed to load games: ' + error.message);
  } finally {
    showLoading(false);
  }
  
  // Featured Games button
  document.getElementById('featuredGames')?.addEventListener('click', async function() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    document.getElementById('section-title').textContent = 'Featured Games';
    try {
      showLoading(true);
      const games = await gameAPI.getAll();
      const featured = [...games]
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 10);
      renderGameGrid(featured, 'games-container');
    } catch (error) {
      showError('Failed to load games');
    } finally {
      showLoading(false);
    }
  });
  
  // Anticipated Games button
  document.getElementById('anticipatedGames')?.addEventListener('click', async function() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    document.getElementById('section-title').textContent = 'Anticipated Games';
    try {
      showLoading(true);
      // Filter upcoming games where release date > current date
      const allGames = await gameAPI.getAll();
      const upcoming = allGames.filter(game => {
        const releaseDate = new Date(game.releaseDate);
        return releaseDate > CURRENT_DATE && game.upcoming;
      }).sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
      
      renderGameGrid(upcoming, 'games-container');
    } catch (error) {
      showError('Failed to load anticipated games');
    } finally {
      showLoading(false);
    }
  });
};

// Setup featured games carousel
const setupFeaturedCarousel = (games) => {
  // This is a simple implementation - can be enhanced with auto-scroll
  // For now, just display the games
  if (games.length > 0) {
    console.log(`Featured games carousel: ${games.length} games`);
  }
};

// ============================================================================
// USER HOME PAGE
// ============================================================================
const initUserHomePage = async () => {
  try {
    showLoading(true);
    const games = await gameAPI.getAll();
    
    // Sort by release date (ascending - upcoming first)
    const sortedGames = games.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    
    renderGameGrid(sortedGames, 'games-container');
  } catch (error) {
    showError('Failed to load games: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// ============================================================================
// ADMIN HOME PAGE
// ============================================================================
const initAdminHomePage = async () => {
  // Check if user is admin - verify with backend
  const userData = getCurrentUserData();
  if (!userData || !userData.userId) {
    showError('Please log in to access admin panel.');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }
  
  // Double-check admin status with backend
  try {
    const { authAPI } = await import('./services/api.js');
    const adminCheck = await authAPI.verifyAdmin(userData.userId);
    if (!adminCheck.isAdmin) {
      showError('Access denied. Admin only.');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    showError('Failed to verify admin status. Please log in again.');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }
  
  // Setup admin game management
  setupAdminGameManagement();
  
  // Load all games for management
  loadAdminGames();
};

const setupAdminGameManagement = () => {
  // Toggle add game form
  const toggleBtn = document.getElementById('toggleAddGameForm');
  const addForm = document.getElementById('addGameForm');
  const cancelBtn = document.getElementById('cancelAddGame');
  
  toggleBtn?.addEventListener('click', () => {
    if (addForm) {
      addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  cancelBtn?.addEventListener('click', () => {
    if (addForm) {
      addForm.style.display = 'none';
      document.getElementById('newGameForm')?.reset();
    }
  });
  
  // Handle new game form submission
  const newGameForm = document.getElementById('newGameForm');
  newGameForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gameData = {
      gameId: document.getElementById('gameId').value,
      title: document.getElementById('gameTitle').value,
      description: document.getElementById('gameDescription').value,
      releaseDate: document.getElementById('gameReleaseDate').value,
      platform: document.getElementById('gamePlatform').value,
      genre: document.getElementById('gameGenre').value,
      upcoming: document.getElementById('gameUpcoming').checked,
      released: document.getElementById('gameReleased').checked,
      imageBase64: document.getElementById('gameImage').value || ''
    };
    
    try {
      showLoading(true);
      await gameAPI.create(gameData);
      showMessage('Game added successfully!');
      addForm.style.display = 'none';
      newGameForm.reset();
      loadAdminGames(); // Reload games list
    } catch (error) {
      showError('Failed to add game: ' + error.message);
    } finally {
      showLoading(false);
    }
  });
  
  // Sidebar buttons
  document.getElementById('addGameBtn')?.addEventListener('click', () => {
    if (addForm) addForm.style.display = 'block';
  });
  
  document.getElementById('manageGamesBtn')?.addEventListener('click', () => {
    loadAdminGames();
  });
  
  document.getElementById('viewAllReviewsBtn')?.addEventListener('click', () => {
    window.location.href = 'admin_reviews.html';
  });
};

const loadAdminGames = async () => {
  const container = document.getElementById('admin-games-container');
  if (!container) return;
  
  try {
    showLoading(true);
    const games = await gameAPI.getAll();
    
    container.innerHTML = `
      <h4>All Games (${games.length})</h4>
      <div class="game-grid" id="admin-games-grid"></div>
    `;
    
    const grid = document.getElementById('admin-games-grid');
    games.forEach(game => {
      const card = createGameCard(game);
      
      // Add admin controls
      const controls = document.createElement('div');
      controls.className = 'admin-game-controls';
      controls.style.cssText = 'margin-top: 10px; display: flex; gap: 10px;';
      
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn-secondary';
      editBtn.onclick = () => editGame(game);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn-danger';
      deleteBtn.onclick = () => deleteGame(game.gameId || game.id);
      
      controls.appendChild(editBtn);
      controls.appendChild(deleteBtn);
      card.appendChild(controls);
      
      grid.appendChild(card);
    });
  } catch (error) {
    showError('Failed to load games: ' + error.message);
  } finally {
    showLoading(false);
  }
};

const editGame = (game) => {
  // TODO: Implement edit game modal/form
  showMessage('Edit feature coming soon. Use admin-add-game.html for now.');
};

const deleteGame = async (gameId) => {
  if (!confirm('Are you sure you want to delete this game?')) return;
  
  try {
    showLoading(true);
    await gameAPI.delete(gameId);
    showMessage('Game deleted successfully!');
    loadAdminGames();
  } catch (error) {
    showError('Failed to delete game: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// ============================================================================
// CALENDAR PAGE
// ============================================================================
const initCalendarPage = async () => {
  console.log('📅 Calendar page initialized');
  try {
    await initCalendar();
  } catch (error) {
    console.error('Failed to initialize calendar:', error);
    showError('Failed to load calendar');
  }
};

// ============================================================================
// REVIEWS PAGE
// ============================================================================
const initReviewsPage = async () => {
  console.log('⭐ Reviews page initialized');
  
  const currentPage = window.location.pathname.split('/').pop();
  
  // Admin reviews page
  if (currentPage.includes('admin_reviews')) {
    if (!isAdmin()) {
      showError('Access denied. Admin only.');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }
    initAdminReviewsPage();
  } else {
    // User/Guest reviews page
    try {
      showLoading(true);
      const reviews = await reviewAPI.getAll();
      displayReviews(reviews, 'all-reviews-container');
    } catch (error) {
      showError('Failed to load reviews: ' + error.message);
    } finally {
      showLoading(false);
    }
  }
};

const initAdminReviewsPage = async () => {
  const container = document.getElementById('admin-reviews-container');
  if (!container) return;
  
  try {
    showLoading(true);
    const reviews = await reviewAPI.getAllForAdmin();
    
    if (reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">No reviews to moderate.</p>';
      return;
    }
    
    container.innerHTML = reviews.map(review => `
      <div class="review-card admin-review-card" style="background: #1a1a1a; padding: 20px; margin-bottom: 20px; border-radius: 10px;">
        <div class="review-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div>
            <span class="review-author">${review.user?.username || 'Unknown User'}</span>
            <span style="color: #888; margin-left: 10px;">(${review.user?.email || 'N/A'})</span>
          </div>
          <span class="review-date">${new Date(review.dateTimePosted).toLocaleDateString()}</span>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong>Game:</strong> ${review.game?.title || 'Unknown Game'}
          ${review.game?.image ? `<img src="${review.game.image}" alt="${review.game.title}" style="width: 100px; height: 100px; object-fit: cover; margin-left: 10px;">` : ''}
        </div>
        
        ${review.rating ? `<div style="margin-bottom: 10px;"><strong>Rating:</strong> ${'⭐'.repeat(review.rating)}</div>` : ''}
        ${review.text ? `<div class="review-text" style="margin-bottom: 10px;">${review.text}</div>` : ''}
        
        <button class="btn-danger" onclick="deleteReviewAsAdmin('${review.reviewId}')" style="margin-top: 10px;">
          Delete Review
        </button>
      </div>
    `).join('');
    
    // Make delete function globally available
    window.deleteReviewAsAdmin = async (reviewId) => {
      if (!confirm('Are you sure you want to delete this review?')) return;
      
      try {
        showLoading(true);
        await reviewAPI.deleteByAdmin(reviewId);
        showMessage('Review deleted successfully!');
        initAdminReviewsPage(); // Reload
      } catch (error) {
        showError('Failed to delete review: ' + error.message);
      } finally {
        showLoading(false);
      }
    };
  } catch (error) {
    showError('Failed to load reviews: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// ============================================================================
// MY FAVORITES PAGE
// ============================================================================
const initMyFavoritesPage = async () => {
  const container = document.getElementById('favorites-container');
  if (!container) return;
  
  const userData = getCurrentUserData();
  if (!userData || !userData.userId) {
    container.innerHTML = '<p>Please log in to view your favorites.</p>';
    return;
  }
  
  try {
    showLoading(true);
    const favorites = await favoriteAPI.getUserFavorites(userData.userId);
    
    if (favorites.length === 0) {
      container.innerHTML = '<p class="no-games">You haven\'t favorited any games yet.</p>';
      return;
    }
    
    const games = favorites.map(fav => fav.game);
    renderGameGrid(games, 'favorites-container');
  } catch (error) {
    showError('Failed to load favorites: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// ============================================================================
// MY REVIEWS PAGE
// ============================================================================
const initMyReviewsPage = async () => {
  const container = document.getElementById('my-reviews-container');
  if (!container) return;
  
  const userData = getCurrentUserData();
  if (!userData || !userData.userId) {
    container.innerHTML = '<p>Please log in to view your reviews.</p>';
    return;
  }
  
  try {
    showLoading(true);
    const reviews = await reviewAPI.getByUser(userData.userId);
    
    if (reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">You haven\'t written any reviews yet.</p>';
      return;
    }
    
    // Display reviews with game info
    container.innerHTML = reviews.map(review => `
      <div class="review-card" style="background: #1a1a1a; padding: 20px; margin-bottom: 20px; border-radius: 10px;">
        <div class="review-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>Game ID:</strong> ${review.gameId}</span>
          <span class="review-date">${new Date(review.dateTimePosted).toLocaleDateString()}</span>
        </div>
        ${review.rating ? `<div style="margin-bottom: 10px;"><strong>Rating:</strong> ${'⭐'.repeat(review.rating)}</div>` : ''}
        ${review.text ? `<div class="review-text">${review.text}</div>` : ''}
        <div style="margin-top: 10px;">
          <button class="btn-secondary" onclick="editMyReview('${review.reviewId}')">Edit</button>
          <button class="btn-danger" onclick="deleteMyReview('${review.reviewId}', '${userData.userId}')" style="margin-left: 10px;">Delete</button>
        </div>
      </div>
    `).join('');
    
    // Make functions globally available
    window.deleteMyReview = async (reviewId, userId) => {
      if (!confirm('Are you sure you want to delete this review?')) return;
      
      try {
        showLoading(true);
        await reviewAPI.delete(reviewId, userId, false);
        showMessage('Review deleted successfully!');
        initMyReviewsPage(); // Reload
      } catch (error) {
        showError('Failed to delete review: ' + error.message);
      } finally {
        showLoading(false);
      }
    };
    
    window.editMyReview = (reviewId) => {
      // TODO: Implement edit review modal
      showMessage('Edit feature coming soon!');
    };
  } catch (error) {
    showError('Failed to load reviews: ' + error.message);
  } finally {
    showLoading(false);
  }
};

// ============================================================================
// NAVIGATION SETUP
// ============================================================================
const setupNavigationButtons = () => {
  // My Favorites button
  document.getElementById('myFavorites')?.addEventListener('click', () => {
    window.location.href = 'my-favorites.html';
  });
  
  // My Reviews buttons
  document.querySelectorAll('#myReviews').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'my-reviews.html';
    });
  });
};

// ============================================================================
// AUTHENTICATION SETUP
// ============================================================================
const setupAuthButtons = () => {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.querySelector('.logout');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'block';
    });
  }
  
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      if (signupModal) signupModal.style.display = 'block';
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const result = await logout();
      if (result.success) {
        showMessage('Logged out successfully');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    });
  }
  
  // Close modals
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      showLoading(true);
      const result = await login(email, password);
      showLoading(false);
      
      if (result.success) {
        const userData = result.userData;
        showMessage(`Welcome back, ${userData?.username || 'User'}!`);
        if (loginModal) {
          loginModal.style.display = 'none';
          loginForm.reset();
        }
        
        setTimeout(() => {
          if (userData?.administrator) {
            window.location.href = 'admin_index.html';
          } else {
            window.location.href = 'user_index.html';
          }
        }, 1000);
      } else {
        showError(result.error || 'Login failed');
      }
    });
  }
  
  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signupUsername').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      
      showLoading(true);
      const result = await register(email, password, username);
      showLoading(false);
      
      if (result.success) {
        showMessage(`Welcome ${result.username || username}! Account created successfully!`);
        if (signupModal) {
          signupModal.style.display = 'none';
          signupForm.reset();
        }
        setTimeout(() => {
          window.location.href = 'user_index.html';
        }, 1500);
      } else {
        showError(result.error || 'Registration failed');
      }
    });
  }
};
