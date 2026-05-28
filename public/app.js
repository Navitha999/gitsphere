/* ==========================================================================
   GITSphere // Client-Side Dashboard Controller Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Proactive protocol check for beginners
  if (window.location.protocol === 'file:') {
    alert("🚀 Pro-Tip: You opened index.html directly from your hard drive (file://).\n\nTo allow the frontend to talk to the backend, please:\n1. Run the server in your terminal: npm run dev\n2. Open http://localhost:5000 in your browser instead!");
    showToast("Application opened as local file. Please visit http://localhost:5000", "error");
  }

  // --- 1. Global Application State ---
  const state = {
    currentUsername: '',
    currentPage: 1,
    limit: 5,
    search: '',
    tier: '',
    sortBy: 'analyzed_at',
    sortOrder: 'DESC',
    activeProfileId: null
  };

  // Safe helper to render Lucide icons without crashing if CDN is blocked or slow
  const safeCreateIcons = () => {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons();
      } catch (err) {
        console.error('Error rendering Lucide icons:', err);
      }
    } else {
      console.warn('Lucide icon library is not loaded. Icons will fall back to text.');
    }
  };

  // --- 2. DOM Elements Bindings ---
  // Forms & Inputs
  const searchForm = document.getElementById('search-form');
  const usernameInput = document.getElementById('username-input');
  const analyzeBtn = document.getElementById('analyze-btn');

  // Controls Sidebar
  const dbSearch = document.getElementById('db-search');
  const dbFilterTier = document.getElementById('db-filter-tier');
  const dbSortBy = document.getElementById('db-sort-by');
  const recordsCount = document.getElementById('records-count');
  const historyContainer = document.getElementById('history-container');
  
  // Pagination
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');

  // Dynamic Panels
  const stepperCard = document.getElementById('stepper-card');
  const dashboardPlaceholder = document.getElementById('dashboard-placeholder');
  const dashboardView = document.getElementById('dashboard-view');
  const reposContainer = document.getElementById('repos-container');

  // Dashboard Stats Profile Fields
  const profAvatar = document.getElementById('prof-avatar');
  const profName = document.getElementById('prof-name');
  const profUsername = document.getElementById('prof-username');
  const profGithubLink = document.getElementById('prof-github-link');
  const profBio = document.getElementById('prof-bio');
  const profLocation = document.getElementById('prof-location');
  const profJoined = document.getElementById('prof-joined');

  // Dashboard Scores & Tiers
  const profTierValue = document.getElementById('prof-tier-value');
  const profTier = document.getElementById('prof-tier');
  const tierContainer = document.querySelector('.tier-container');
  const tierGlowRing = document.querySelector('.tier-glow-ring');
  
  const profPopularity = document.getElementById('prof-popularity');
  const profActivity = document.getElementById('prof-activity');
  const profStars = document.getElementById('prof-stars');
  const profAvgStars = document.getElementById('prof-avg-stars');
  const profForks = document.getElementById('prof-forks');
  const profRatio = document.getElementById('prof-ratio');
  const profFollowersCount = document.getElementById('prof-followers-count');
  const profFollowingCount = document.getElementById('prof-following-count');
  const profReposCount = document.getElementById('prof-repos-count');
  const profGistsCount = document.getElementById('prof-gists-count');
  const profAge = document.getElementById('prof-age');
  const profLang = document.getElementById('prof-lang');

  // Toast
  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  // --- 3. Initial UI Bootstrap ---
  safeCreateIcons();
  fetchDatabaseProfiles();

  // --- 4. Event Listeners ---

  // Handle Search Form Submission (Analyze Profile)
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUsername = usernameInput.value.trim();
    if (!targetUsername) return;

    await analyzeUserProfile(targetUsername);
  });

  // Sidebar Controls (Search, Filter, Sort)
  let searchDebounceTimer;
  dbSearch.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.search = dbSearch.value.trim();
      state.currentPage = 1; // Reset to page 1 on new search query
      fetchDatabaseProfiles();
    }, 450); // Debounce search entries by 450ms
  });

  dbFilterTier.addEventListener('change', () => {
    state.tier = dbFilterTier.value;
    state.currentPage = 1;
    fetchDatabaseProfiles();
  });

  dbSortBy.addEventListener('change', () => {
    state.sortBy = dbSortBy.value;
    state.currentPage = 1;
    fetchDatabaseProfiles();
  });

  // Pagination Interactions
  prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      fetchDatabaseProfiles();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    state.currentPage++;
    fetchDatabaseProfiles();
  });


  // --- 5. Network Requests & API Operations ---

  /**
   * Triggers the Express analyzer backend engine.
   * Feeds the stepper UI for detailed progress feedback before rendering.
   */
  async function analyzeUserProfile(username) {
    // 1. Prepare UI States
    usernameInput.disabled = true;
    analyzeBtn.disabled = true;
    dashboardPlaceholder.classList.add('hidden');
    dashboardView.classList.add('hidden');
    
    // Reset and reveal the Stepper Card
    resetStepperState();
    stepperCard.classList.remove('hidden');

    try {
      // Step 1: Active Retrieval
      setStepActive(1);
      
      // Delay slightly for natural visual pacing of step transitions
      await delay(800);
      setStepCompleted(1);
      setStepActive(2);

      // Trigger the real backend network request
      const responsePromise = fetch(`/api/github/analyze/${username}`);
      
      await delay(900);
      setStepCompleted(2);
      setStepActive(3);

      const response = await responsePromise;
      const result = await response.json();

      await delay(700);
      setStepCompleted(3);
      setStepActive(4);

      if (!result.success) {
        throw new Error(result.message || 'Failed to analyze user.');
      }

      await delay(600);
      setStepCompleted(4);
      await delay(300);

      // Render the successfully loaded data
      renderProfileDashboard(result.data);
      showToast(`Successfully analyzed developer @${username}`, 'success');

      // Refresh database records since a new profile was added/updated
      fetchDatabaseProfiles();

    } catch (error) {
      console.error('Analysis error:', error);
      showToast(error.message || 'Error occurred during GitSphere analysis.', 'error');
      
      // Revert display back to placeholder
      dashboardPlaceholder.classList.remove('hidden');
      dashboardView.classList.add('hidden');
    } finally {
      // Restore UI States
      stepperCard.classList.add('hidden');
      usernameInput.disabled = false;
      analyzeBtn.disabled = false;
      usernameInput.value = '';
    }
  }

  /**
   * Queries Express database records history.
   */
  async function fetchDatabaseProfiles() {
    try {
      const queryParams = new URLSearchParams({
        page: state.currentPage,
        limit: state.limit,
        search: state.search,
        tier: state.tier,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      });

      const response = await fetch(`/api/github/profiles?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to retrieve stored records.');
      }

      renderHistorySidebar(result.data, result.pagination);

    } catch (error) {
      console.error('Failed to load database history:', error);
      showToast('Could not load database records.', 'error');
    }
  }

  /**
   * Deletes a record from the database.
   */
  async function deleteProfileRecord(username, event) {
    event.stopPropagation(); // Avoid triggering card row click event
    
    if (!confirm(`Are you sure you want to delete analyzed intelligence for developer @${username}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/github/profiles/${username}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete profile.');
      }

      showToast(`Deleted database profile for @${username}`, 'success');

      // Check if deleted profile was currently showing in main workspace
      if (state.currentUsername.toLowerCase() === username.toLowerCase()) {
        state.currentUsername = '';
        state.activeProfileId = null;
        dashboardView.classList.add('hidden');
        dashboardPlaceholder.classList.remove('hidden');
      }

      // Re-fetch profiles list
      fetchDatabaseProfiles();

    } catch (error) {
      console.error('Delete operation failure:', error);
      showToast(error.message || 'Error during profile deletion.', 'error');
    }
  }

  /**
   * Fetches full profile details for a specific user from MySQL DB.
   */
  async function loadSingleSavedProfile(username) {
    try {
      const response = await fetch(`/api/github/profiles/${username}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch stored profile.');
      }

      renderProfileDashboard(result.data);
      showToast(`Loaded details for @${username} from database.`, 'info');

      // Highlight active profile row in sidebar
      updateSidebarActiveHighlight(result.data.id);

    } catch (error) {
      console.error('Load details failure:', error);
      showToast(error.message || 'Could not load profile details.', 'error');
    }
  }


  // --- 6. View Rendering & DOM Bindings ---

  /**
   * Populates the primary analytical dashboard panels.
   */
  function renderProfileDashboard(profile) {
    state.currentUsername = profile.username;
    state.activeProfileId = profile.id;

    // Direct text fields
    profAvatar.src = profile.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80';
    profName.textContent = profile.name || profile.username;
    profUsername.textContent = profile.username;
    profGithubLink.href = profile.profile_url;
    profBio.textContent = profile.bio || 'This developer has no bio configured in GitHub.';
    
    // Location parse
    profLocation.textContent = 'Active Dev'; // Default fallback since location isn't stored in basic schema, or parse location
    if (profile.bio && profile.bio.toLowerCase().includes('remote')) {
      profLocation.textContent = 'Remote';
    }

    // Join date format
    if (profile.account_created_at) {
      const date = new Date(profile.account_created_at);
      profJoined.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } else {
      profJoined.textContent = 'N/A';
    }

    // Developer scores
    profPopularity.textContent = parseFloat(profile.popularity_score || 0).toLocaleString();
    profActivity.textContent = parseFloat(profile.activity_score || 0).toLocaleString();
    profStars.textContent = (profile.total_stars || 0).toLocaleString();
    profAvgStars.textContent = `${parseFloat(profile.total_stars / (profile.public_repos || 1)).toFixed(2)} stars/repo avg`;
    profForks.textContent = (profile.total_forks || 0).toLocaleString();
    profRatio.textContent = parseFloat(profile.follower_to_following_ratio || 0).toFixed(2);
    profFollowersCount.textContent = (profile.followers || 0).toLocaleString();
    profFollowingCount.textContent = (profile.following_count || 0).toLocaleString();
    profReposCount.textContent = (profile.public_repos || 0).toLocaleString();
    profGistsCount.textContent = (profile.public_gists || 0).toLocaleString();
    profAge.textContent = `${(profile.account_age_days || 0).toLocaleString()} days`;
    profLang.textContent = profile.most_used_language || 'Unknown';

    // Apply Tier Badge Aesthetics
    applyTierBadgeStyling(profile.developer_tier);

    // Populate Top 5 Repositories
    renderTopRepositoriesList(profile.top_repositories || []);

    // Display the Dashboard, Hide Placeholder
    dashboardPlaceholder.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    // Run Lucide engine to parse any freshly injected icons
    safeCreateIcons();
    
    // Scroll to dashboard top viewport smoothly on small devices
    if (window.innerWidth <= 1100) {
      dashboardView.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Applies gorgeous styling theme values depending on Developer Tier.
   */
  function applyTierBadgeStyling(tierName) {
    const tier = (tierName || 'Tier C').toUpperCase();
    profTierValue.textContent = tier;

    // Reset styles
    tierGlowRing.className = 'tier-glow-ring';
    profTier.className = 'tier-badge';
    profTierValue.className = 'tier-value';

    if (tier.includes('S')) {
      tierGlowRing.classList.add('tier-s-glow');
      profTier.classList.add('tier-s-badge');
      profTierValue.classList.add('tier-s-text');
    } else if (tier.includes('A')) {
      tierGlowRing.classList.add('tier-a-glow');
      profTier.classList.add('tier-a-badge');
      profTierValue.classList.add('tier-a-text');
    } else if (tier.includes('B')) {
      tierGlowRing.classList.add('tier-b-glow');
      profTier.classList.add('tier-b-badge');
      profTierValue.classList.add('tier-b-text');
    } else {
      tierGlowRing.classList.add('tier-c-glow');
      profTier.classList.add('tier-c-badge');
      profTierValue.classList.add('tier-c-text');
    }
  }

  /**
   * Renders the grid of top 5 repositories.
   */
  function renderTopRepositoriesList(repos) {
    reposContainer.innerHTML = '';

    if (repos.length === 0) {
      reposContainer.innerHTML = `
        <div class="glass-card" style="grid-column: span 2; text-align: center; color: hsl(var(--text-muted)); font-style: italic; padding: 2.5rem;">
          No public repositories fetched for this account.
        </div>
      `;
      return;
    }

    repos.forEach(repo => {
      const card = document.createElement('a');
      card.href = repo.repo_url;
      card.target = '_blank';
      card.className = 'repo-card';
      
      card.innerHTML = `
        <div class="repo-top">
          <div class="repo-header">
            <span class="repo-name">${repo.repo_name}</span>
            <i data-lucide="external-link" class="link-icon"></i>
          </div>
        </div>
        <div class="repo-meta">
          <span class="repo-meta-item">
            <i data-lucide="star" class="star-active"></i>
            <span>${(repo.stars || 0).toLocaleString()}</span>
          </span>
          <span class="repo-meta-item">
            <i data-lucide="git-fork" class="fork-active"></i>
            <span>${(repo.forks || 0).toLocaleString()}</span>
          </span>
          <span class="repo-lang-badge">${repo.language || 'Unknown'}</span>
        </div>
      `;
      reposContainer.appendChild(card);
    });
  }

  /**
   * Render side panel containing history of search operations.
   */
  function renderHistorySidebar(profiles, pagination) {
    historyContainer.innerHTML = '';
    recordsCount.textContent = `${pagination.total_items} ${pagination.total_items === 1 ? 'profile' : 'profiles'} saved`;

    if (profiles.length === 0) {
      historyContainer.innerHTML = `
        <div class="glass-card" style="text-align: center; color: hsl(var(--text-muted)); padding: 3rem 1.5rem; font-style: italic;">
          No matching profiles found in database.
        </div>
      `;
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
      currentPageSpan.textContent = '1';
      totalPagesSpan.textContent = '1';
      return;
    }

    // Render items
    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = `history-card ${state.activeProfileId === p.id ? 'active-selection' : ''}`;
      card.dataset.id = p.id;
      
      // Determine mini-tier label
      const tierShort = p.developer_tier ? p.developer_tier.split(' ')[1] || 'C' : 'C';

      card.innerHTML = `
        <div class="history-card-left">
          <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80'}" class="history-avatar" alt="${p.username}">
          <div class="history-info">
            <div class="history-name-row">
              <span class="history-name" title="${p.name || p.username}">${p.name || p.username}</span>
              <span class="mini-tier ${tierShort}">${tierShort}</span>
            </div>
            <span class="history-subtitle">@${p.username} • Pop: <span class="history-subtitle-span">${parseFloat(p.popularity_score || 0).toLocaleString()}</span></span>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn-delete-row" title="Delete Profile" data-username="${p.username}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      // Set up click handler to load details
      card.addEventListener('click', () => loadSingleSavedProfile(p.username));

      // Set up delete click handler
      const delBtn = card.querySelector('.btn-delete-row');
      delBtn.addEventListener('click', (e) => deleteProfileRecord(p.username, e));

      historyContainer.appendChild(card);
    });

    // Handle Pagination Buttons
    currentPageSpan.textContent = pagination.current_page;
    totalPagesSpan.textContent = pagination.total_pages;
    
    prevPageBtn.disabled = pagination.current_page <= 1;
    nextPageBtn.disabled = pagination.current_page >= pagination.total_pages;

    // Run Lucide vector icon generator
    safeCreateIcons();
  }

  /**
   * Adjusts the UI highlight for currently loaded sidebar items.
   */
  function updateSidebarActiveHighlight(profileId) {
    const cards = historyContainer.querySelectorAll('.history-card');
    cards.forEach(c => {
      if (parseInt(c.dataset.id) === parseInt(profileId)) {
        c.classList.add('active-selection');
      } else {
        c.classList.remove('active-selection');
      }
    });
  }


  // --- 7. Helper Utilities ---

  // Simple visual delay utility
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stepper Visual Utilities
  function resetStepperState() {
    const steps = stepperCard.querySelectorAll('.step-item');
    steps.forEach(step => {
      step.className = 'step-item';
      const numIcon = step.querySelector('.step-num');
      // Reset icons to their original states inside the HTML
    });
  }

  function setStepActive(stepNum) {
    const step = document.getElementById(`step-${stepNum}`);
    if (step) {
      step.classList.add('active');
    }
  }

  function setStepCompleted(stepNum) {
    const step = document.getElementById(`step-${stepNum}`);
    if (step) {
      step.classList.remove('active');
      step.classList.add('completed');
    }
  }

  // Sliding Toast Alert Notification System
  let toastTimer;
  function showToast(message, type = 'info') {
    clearTimeout(toastTimer);
    
    toastMessage.textContent = message;
    
    // Set notification color themes depending on statuses
    toastNotification.className = 'toast';
    
    if (type === 'error') {
      toastNotification.classList.add('error-toast');
      toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else if (type === 'success') {
      toastIcon.setAttribute('data-lucide', 'check-circle');
    } else {
      toastIcon.setAttribute('data-lucide', 'info');
    }
    
    safeCreateIcons(); // Updates toast icon vector

    // Slide-in toast
    toastNotification.classList.remove('hidden');

    // Slide-out after delay
    toastTimer = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 4500);
  }
});
