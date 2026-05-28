import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service to interact with the GitHub API.
 */
class GitHubService {
  /**
   * Fetches full profile data and repositories for a username in parallel.
   * 
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} Raw user profile and repositories list
   */
  async fetchProfileData(username) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Profile-Analyzer-API' // GitHub API requires a User-Agent header
    };

    // Add optional GITHUB_TOKEN if specified to bypass rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
      const profileUrl = `https://api.github.com/users/${username}`;
      // Get up to 100 repos (default max page size in GitHub API)
      const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;

      console.log(`Fetching data from GitHub API for user: ${username}`);
      
      // Parallel requests for optimal performance
      const [profileResponse, reposResponse] = await Promise.all([
        axios.get(profileUrl, { headers }),
        axios.get(reposUrl, { headers })
      ]);

      return {
        profile: profileResponse.data,
        repos: reposResponse.data
      };
    } catch (error) {
      // Map Axios/GitHub API specific errors into standard readable app errors
      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          const err = new Error('GitHub user not found');
          err.statusCode = 404;
          throw err;
        }
        if (status === 403 && data?.message?.includes('API rate limit exceeded')) {
          const err = new Error('GitHub API rate limit exceeded. Please try again later or add a GITHUB_TOKEN in your environment configuration.');
          err.statusCode = 429;
          throw err;
        }
        
        const err = new Error(data?.message || 'Failed to fetch data from GitHub API');
        err.statusCode = status;
        throw err;
      } else if (error.request) {
        const err = new Error('No response received from GitHub API. Please check your network connection.');
        err.statusCode = 503;
        throw err;
      } else {
        throw error;
      }
    }
  }
}

export default new GitHubService();
