/**
 * Calculates all required developer insights, scores, rankings, and language stats.
 * Easy to read and extremely robust for beginners.
 * 
 * @param {Object} profile - Raw profile data from GitHub API
 * @param {Array} repos - Raw repository list from GitHub API
 * @returns {Object} Calculated insights
 */
export const calculateInsights = (profile, repos = []) => {
  // --- 1. Basic Fields & Metrics ---
  const followers = profile.followers || 0;
  const following = profile.following || 0;
  const publicRepos = profile.public_repos || 0;
  const publicGists = profile.public_gists || 0;
  const createdAt = profile.created_at;

  // Account age in days
  let accountAgeDays = 0;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - createdDate.getTime();
    accountAgeDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
  }

  // --- 2. Advanced Insights ---

  // Follower to following ratio (avoid division by 0)
  const followerToFollowingRatio = following > 0 
    ? parseFloat((followers / following).toFixed(2)) 
    : parseFloat(followers.toFixed(2));

  // Stars and Forks count
  let totalStars = 0;
  let totalForks = 0;
  const languageCounts = {};

  repos.forEach(repo => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    
    // Track programming languages
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  // Most used programming language
  let mostUsedLanguage = 'Unknown';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedLanguage = lang;
    }
  }

  // Average stars per repository (using repos length or public repos)
  const repoCountWithData = repos.length;
  const averageStarsPerRepo = repoCountWithData > 0 
    ? parseFloat((totalStars / repoCountWithData).toFixed(2)) 
    : 0.00;

  // Popularity Score: (Followers * 10) + Total Stars
  const popularityScore = (followers * 10) + totalStars;

  // Developer Activity Score: Public Repos + (Total Forks * 2) + Public Gists
  const activityScore = publicRepos + (totalForks * 2) + publicGists;

  // Final Ranking Score = Popularity Score + Activity Score
  const totalScore = popularityScore + activityScore;

  // Tier assignment
  let developerTier = 'Tier C';
  if (totalScore > 1000) {
    developerTier = 'Tier S';
  } else if (totalScore > 700) {
    developerTier = 'Tier A';
  } else if (totalScore > 400) {
    developerTier = 'Tier B';
  }

  // Top 5 repositories sorted by Stars (primary) and Forks (secondary)
  const topRepositories = [...repos]
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      }
      return (b.forks_count || 0) - (a.forks_count || 0);
    })
    .slice(0, 5)
    .map(repo => ({
      repo_name: repo.name,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || 'Unknown',
      repo_url: repo.html_url
    }));

  return {
    basic: {
      github_id: profile.id,
      username: profile.login,
      name: profile.name || profile.login,
      bio: profile.bio || '',
      followers,
      following_count: following,
      public_repos: publicRepos,
      public_gists: publicGists,
      account_created_at: createdAt,
      account_age_days: accountAgeDays,
      avatar_url: profile.avatar_url,
      profile_url: profile.html_url
    },
    advanced: {
      follower_to_following_ratio: followerToFollowingRatio,
      popularity_score: popularityScore,
      most_used_language: mostUsedLanguage,
      total_stars: totalStars,
      total_forks: totalForks,
      language_distribution: languageCounts,
      average_stars_per_repo: averageStarsPerRepo,
      activity_score: activityScore,
      developer_tier: developerTier
    },
    top_repositories: topRepositories
  };
};
