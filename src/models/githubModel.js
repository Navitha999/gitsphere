import pool from '../config/db.js';

class GitHubModel {
  /**
   * Saves or updates a github profile and its top repositories using a transaction.
   * 
   * @param {Object} insights - Analyzed developer insights from calculateInsights utility
   * @returns {Promise<number>} Database profile ID
   */
  async upsertProfile(insights) {
    const { basic, advanced, top_repositories } = insights;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Insert or Update basic and advanced profile details
      const profileSql = `
        INSERT INTO github_profiles (
          github_id, username, name, bio, followers, following_count, public_repos, public_gists,
          account_created_at, account_age_days, follower_to_following_ratio, popularity_score,
          developer_tier, total_stars, total_forks, most_used_language, activity_score,
          avatar_url, profile_url, analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          bio = VALUES(bio),
          followers = VALUES(followers),
          following_count = VALUES(following_count),
          public_repos = VALUES(public_repos),
          public_gists = VALUES(public_gists),
          account_age_days = VALUES(account_age_days),
          follower_to_following_ratio = VALUES(follower_to_following_ratio),
          popularity_score = VALUES(popularity_score),
          developer_tier = VALUES(developer_tier),
          total_stars = VALUES(total_stars),
          total_forks = VALUES(total_forks),
          most_used_language = VALUES(most_used_language),
          activity_score = VALUES(activity_score),
          avatar_url = VALUES(avatar_url),
          profile_url = VALUES(profile_url),
          analyzed_at = NOW();
      `;

      const profileValues = [
        basic.github_id,
        basic.username.toLowerCase(), // Store username in lower case for uniform lookup
        basic.name,
        basic.bio,
        basic.followers,
        basic.following_count,
        basic.public_repos,
        basic.public_gists,
        // Convert ISO date string to MySQL DATETIME format
        new Date(basic.account_created_at).toISOString().slice(0, 19).replace('T', ' '),
        basic.account_age_days,
        advanced.follower_to_following_ratio,
        advanced.popularity_score,
        advanced.developer_tier,
        advanced.total_stars,
        advanced.total_forks,
        advanced.most_used_language,
        advanced.activity_score,
        basic.avatar_url,
        basic.profile_url
      ];

      await connection.query(profileSql, profileValues);

      // 2. Fetch the profile ID using username (works for both Insert & Update)
      const [rows] = await connection.query(
        'SELECT id FROM github_profiles WHERE username = ?', 
        [basic.username.toLowerCase()]
      );
      
      if (!rows.length) {
        throw new Error('Profile could not be found after inserting/updating');
      }
      
      const profileDbId = rows[0].id;

      // 3. Clear existing repository entries for this profile to prevent duplication
      await connection.query('DELETE FROM repositories WHERE github_profile_id = ?', [profileDbId]);

      // 4. Batch insert new top repositories
      if (top_repositories && top_repositories.length > 0) {
        const repoSql = `
          INSERT INTO repositories (github_profile_id, repo_name, stars, forks, language, repo_url)
          VALUES ?
        `;
        const repoValues = top_repositories.map(repo => [
          profileDbId,
          repo.repo_name,
          repo.stars,
          repo.forks,
          repo.language,
          repo.repo_url
        ]);
        
        await connection.query(repoSql, [repoValues]);
      }

      await connection.commit();
      return profileDbId;
    } catch (error) {
      await connection.rollback();
      console.error('Database transaction failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieves a single profile and its associated repositories.
   * 
   * @param {string} username - GitHub username
   * @returns {Promise<Object|null>} Stored profile analysis with repositories
   */
  async getProfileByUsername(username) {
    const profileSql = 'SELECT * FROM github_profiles WHERE username = ?';
    const [profiles] = await pool.query(profileSql, [username.toLowerCase()]);

    if (!profiles.length) {
      return null;
    }

    const profile = profiles[0];

    const repoSql = 'SELECT repo_name, stars, forks, language, repo_url FROM repositories WHERE github_profile_id = ? ORDER BY stars DESC, forks DESC';
    const [repos] = await pool.query(repoSql, [profile.id]);

    // Format fields back into original nested format or flat structure for clean client usage
    return {
      id: profile.id,
      github_id: profile.github_id,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      followers: profile.followers,
      following_count: profile.following_count,
      public_repos: profile.public_repos,
      public_gists: profile.public_gists,
      account_created_at: profile.account_created_at,
      account_age_days: profile.account_age_days,
      follower_to_following_ratio: parseFloat(profile.follower_to_following_ratio),
      popularity_score: parseFloat(profile.popularity_score),
      developer_tier: profile.developer_tier,
      total_stars: profile.total_stars,
      total_forks: profile.total_forks,
      most_used_language: profile.most_used_language,
      activity_score: parseFloat(profile.activity_score),
      avatar_url: profile.avatar_url,
      profile_url: profile.profile_url,
      analyzed_at: profile.analyzed_at,
      top_repositories: repos
    };
  }

  /**
   * Retrieves all profiles with searching, filtering, sorting, and pagination.
   * 
   * @param {Object} query - Filtering & pagination parameters
   * @returns {Promise<Object>} List of profiles and pagination metadata
   */
  async getAllProfiles({ page = 1, limit = 10, search = '', tier = '', sortBy = 'analyzed_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;

    let countSql = 'SELECT COUNT(*) as total FROM github_profiles';
    let selectSql = 'SELECT * FROM github_profiles';
    const whereConditions = [];
    const values = [];

    // 1. Apply Search filter safely
    if (search) {
      whereConditions.push('(username LIKE ? OR name LIKE ?)');
      const searchWildcard = `%${search}%`;
      values.push(searchWildcard, searchWildcard);
    }

    // 2. Apply Tier filter safely
    if (tier) {
      whereConditions.push('developer_tier = ?');
      values.push(tier.toUpperCase());
    }

    // Combine WHERE clause if filters exist
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      selectSql += whereClause;
    }

    // 3. Apply sorting safely (validate sort column to prevent SQL injection)
    const allowedSortFields = ['username', 'name', 'followers', 'public_repos', 'popularity_score', 'activity_score', 'analyzed_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'analyzed_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    selectSql += ` ORDER BY ${validSortBy} ${validSortOrder}`;

    // 4. Apply pagination
    selectSql += ' LIMIT ? OFFSET ?';
    const selectValues = [...values, parseInt(limit), parseInt(offset)];

    // Execute queries in parallel for high performance
    const [
      [countResult],
      [profilesResult]
    ] = await Promise.all([
      pool.query(countSql, values),
      pool.query(selectSql, selectValues)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      profiles: profilesResult.map(profile => ({
        ...profile,
        follower_to_following_ratio: parseFloat(profile.follower_to_following_ratio),
        popularity_score: parseFloat(profile.popularity_score),
        activity_score: parseFloat(profile.activity_score)
      })),
      pagination: {
        total_items: total,
        total_pages: totalPages,
        current_page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Deletes a profile from the database. Repositories will automatically be deleted via cascading.
   * 
   * @param {string} username - GitHub username
   * @returns {Promise<boolean>} True if profile was deleted, false if not found
   */
  async deleteProfile(username) {
    const [result] = await pool.query('DELETE FROM github_profiles WHERE username = ?', [username.toLowerCase()]);
    return result.affectedRows > 0;
  }
}

export default new GitHubModel();
