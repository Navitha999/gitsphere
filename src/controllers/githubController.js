import githubService from '../services/githubService.js';
import { calculateInsights } from '../utils/calculateInsights.js';
import githubModel from '../models/githubModel.js';

class GitHubController {
  /**
   * Fetches profile data from GitHub, calculates advanced developer insights,
   * stores/updates them in the database, and returns the full analysis.
   */
  async analyzeProfile(req, res, next) {
    const { username } = req.params;

    try {
      console.log(`[CONTROLLER] Starting analysis for user: ${username}`);
      
      // 1. Fetch data from GitHub API (profile & repos in parallel)
      const rawData = await githubService.fetchProfileData(username);

      // 2. Perform analytical insights calculations
      const insights = calculateInsights(rawData.profile, rawData.repos);

      // 3. Upsert data to the MySQL database
      await githubModel.upsertProfile(insights);

      // 4. Fetch the newly saved/updated complete profile from DB (for response)
      const completeAnalysis = await githubModel.getProfileByUsername(username);

      return res.status(200).json({
        success: true,
        message: 'Profile analyzed and saved successfully',
        data: completeAnalysis
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all analyzed profiles with support for filtering, pagination, sorting, and search.
   */
  async getAllProfiles(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        tier = '',
        sortBy = 'analyzed_at',
        sortOrder = 'DESC'
      } = req.query;

      console.log('[CONTROLLER] Listing profiles with query:', req.query);

      const result = await githubModel.getAllProfiles({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        tier,
        sortBy,
        sortOrder
      });

      return res.status(200).json({
        success: true,
        message: 'Profiles retrieved successfully',
        data: result.profiles,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single analyzed developer profile by its username.
   */
  async getSingleProfile(req, res, next) {
    const { username } = req.params;

    try {
      console.log(`[CONTROLLER] Getting profile details for user: ${username}`);
      const profile = await githubModel.getProfileByUsername(username);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: `Profile for user '${username}' has not been analyzed yet. Run analysis first at: GET /api/github/analyze/${username}`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an analyzed profile and its associated repositories.
   */
  async deleteProfile(req, res, next) {
    const { username } = req.params;

    try {
      console.log(`[CONTROLLER] Request to delete user profile: ${username}`);
      const wasDeleted = await githubModel.deleteProfile(username);

      if (!wasDeleted) {
        return res.status(404).json({
          success: false,
          message: `Profile for user '${username}' not found`
        });
      }

      return res.status(200).json({
        success: true,
        message: `Profile and repositories for user '${username}' deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GitHubController();
