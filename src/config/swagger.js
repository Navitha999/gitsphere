/**
 * Swagger documentation specification for the GitHub Profile Analyzer API.
 */
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    description: 'A production-ready REST API that fetches profile details from the GitHub Public API, performs advanced analytics (developer scores, rankings, language distributions, etc.), and stores results in a MySQL database.',
    contact: {
      name: 'Developer Support'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  paths: {
    '/api/github/analyze/{username}': {
      get: {
        summary: 'Analyze a GitHub profile',
        description: 'Fetches raw user details and repositories from GitHub, calculates custom metrics (tiers, stars, follower ratio, activity score), and saves or updates the profile in the MySQL database.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username to analyze',
            schema: {
              type: 'string',
              example: 'octocat'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile analyzed and saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile analyzed and saved successfully' },
                    data: { $ref: '#/components/schemas/AnalyzedProfile' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Validation errors (e.g. invalid username format)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Validation Error: Invalid GitHub username format' }
                  }
                }
              }
            }
          },
          404: {
            description: 'GitHub user not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'GitHub user not found' }
                  }
                }
              }
            }
          },
          429: {
            description: 'GitHub API rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'GitHub API rate limit exceeded. Please try again later.' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/github/profiles': {
      get: {
        summary: 'Get all analyzed profiles',
        description: 'Retrieves all previously analyzed user profiles with full support for search, tier filtering, custom sorting, and pagination.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number for pagination'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Number of results to return per page'
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search string to filter by username or name'
          },
          {
            name: 'tier',
            in: 'query',
            schema: { type: 'string', enum: ['S', 'A', 'B', 'C'] },
            description: 'Filter profiles by developer rank tier'
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['username', 'name', 'followers', 'public_repos', 'popularity_score', 'activity_score', 'analyzed_at'],
              default: 'analyzed_at'
            },
            description: 'Field to sort profiles by'
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
            description: 'Sorting order direction'
          }
        ],
        responses: {
          200: {
            description: 'Profiles retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profiles retrieved successfully' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProfileSummary' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        total_items: { type: 'integer', example: 12 },
                        total_pages: { type: 'integer', example: 2 },
                        current_page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/github/profiles/{username}': {
      get: {
        summary: 'Get a single analyzed profile',
        description: 'Retrieves a single user profile analysis stored in the database, including the list of top 5 repositories.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'GitHub username to retrieve',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile retrieved successfully' },
                    data: { $ref: '#/components/schemas/AnalyzedProfile' }
                  }
                }
              }
            }
          },
          404: {
            description: 'Profile has not been analyzed yet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: "Profile for user 'octocat' has not been analyzed yet." }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete an analyzed profile',
        description: 'Removes the profile analysis and all associated repositories from the database.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'GitHub username to delete',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Profile deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: "Profile and repositories for user 'octocat' deleted successfully" }
                  }
                }
              }
            }
          },
          404: {
            description: 'Profile not found in database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: "Profile for user 'octocat' not found" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ProfileSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          github_id: { type: 'integer', example: 5832347 },
          username: { type: 'string', example: 'octocat' },
          name: { type: 'string', example: 'The Octocat' },
          bio: { type: 'string', example: 'Testing github api' },
          followers: { type: 'integer', example: 9800 },
          following_count: { type: 'integer', example: 9 },
          public_repos: { type: 'integer', example: 8 },
          public_gists: { type: 'integer', example: 4 },
          account_created_at: { type: 'string', format: 'date-time', example: '2011-01-25T18:44:36Z' },
          account_age_days: { type: 'integer', example: 5500 },
          follower_to_following_ratio: { type: 'number', example: 1088.89 },
          popularity_score: { type: 'number', example: 98015 },
          developer_tier: { type: 'string', example: 'Tier S' },
          total_stars: { type: 'integer', example: 15 },
          total_forks: { type: 'integer', example: 20 },
          most_used_language: { type: 'string', example: 'Ruby' },
          activity_score: { type: 'number', example: 52.0 },
          avatar_url: { type: 'string', example: 'https://avatars.githubusercontent.com/u/5832347?v=4' },
          profile_url: { type: 'string', example: 'https://github.com/octocat' },
          analyzed_at: { type: 'string', format: 'date-time', example: '2026-05-27T16:00:00Z' }
        }
      },
      Repository: {
        type: 'object',
        properties: {
          repo_name: { type: 'string', example: 'boysenberry-repo-1' },
          stars: { type: 'integer', example: 12 },
          forks: { type: 'integer', example: 8 },
          language: { type: 'string', example: 'Ruby' },
          repo_url: { type: 'string', example: 'https://github.com/octocat/boysenberry-repo-1' }
        }
      },
      AnalyzedProfile: {
        allOf: [
          { $ref: '#/components/schemas/ProfileSummary' },
          {
            type: 'object',
            properties: {
              top_repositories: {
                type: 'array',
                items: { $ref: '#/components/schemas/Repository' }
              }
            }
          }
        ]
      }
    }
  }
};
