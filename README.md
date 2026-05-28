# 🚀 GitHub Profile Analyzer API

A robust, production-ready REST API built with Node.js, Express.js, and MySQL. It retrieves user profiles from the GitHub Public API, conducts advanced metrics analysis (developer tiers, popularity rankings, repositories distribution), and saves/updates information automatically in a database. Designed with a clean folder structure and beginners in mind!

---

## 🌟 Features

* **GitHub Integration**: Leverages parallel API calls (`Promise.all`) to fetch profile data and public repositories in a single run.
* **Developer Analytical Insights**:
  * **Basic Metrics**: Bio, followers, following, gists, repos count, account age (in days), profile/avatar URLs.
  * **Advanced Analytics**: Follower-to-following ratio, average stars per repo, total stars, total forks, most used programming language.
  * **Ranking System**: Calculates custom **Popularity** and **Activity** scores to assign developers into Tiers (`Tier S`, `Tier A`, `Tier B`, `Tier C`).
  * **Top 5 Repositories**: Filters and returns the top 5 repositories sorted by stars and forks.
* **Smart Duplicates (Upsert)**: Updates existing developer analyses with the latest GitHub details automatically without adding duplicate records using SQL's `ON DUPLICATE KEY UPDATE` syntax.
* **Pagination, Sorting, & Filtering**: Retrieve all profiles with built-in search, tier filters, sorting keys, and configurable pages.
* **Built-in Security**: Hardened using **Helmet** headers, **CORS** configurations, and **Express Rate Limiting** to prevent DDoS or raw scripting abuses.
* **Clean Input Validation**: Validates user inputs and formats errors using `express-validator` to guarantee clean data.
* **Centralized Error Handler**: Translates API failures, rate-limits, and SQL database disconnects into uniform JSON responses.
* **Auto-Schema Creation**: Automatically connects to the database on start and initializes the MySQL tables if they do not exist.
* **Bonus - Swagger UI Docs**: Interactive documentation page auto-generated on `/api-docs`.
* **Bonus - Docker Containerization**: Configured with a multi-stage container `Dockerfile` and a local `docker-compose` runner.

---

## 🛠️ Required Tech Stack

* **Runtime & Framework**: Node.js (ES6 Modules syntax), Express.js
* **Database Driver**: `mysql2/promise` (Promise pool)
* **HTTP Client**: `axios` (for GitHub calls)
* **Security & Logging**: `cors`, `helmet`, `express-rate-limit`, `morgan`
* **Validation**: `express-validator`
* **Config & Docs**: `dotenv`, `swagger-ui-express`

---

## 📂 Project Structure

```txt
src/
│
├── config/
│   ├── db.js                 # Pool connection setup & auto-database tables initialization
│   └── swagger.js            # Complete Swagger documentation configuration
│
├── controllers/
│   └── githubController.js   # Handles Express requests, triggers services, and responds
│
├── middleware/
│   ├── errorMiddleware.js    # Global error handlers & unmatched route intercepts
│   └── validationMiddleware.js# User request query/parameter validator rules
│
├── models/
│   └── githubModel.js        # Safe, parameterized raw SQL database queries (CRUD/Upsert)
│
├── routes/
│   └── githubRoutes.js       # Mapping endpoints to validators & controllers
│
├── services/
│   └── githubService.js      # Core logic fetching from external GitHub API (Parallel calls)
│
├── utils/
│   └── calculateInsights.js  # Score, tier, and advanced developer metric calculators
│
├── app.js                    # Core Express configurations (Middlewares, Security, Routers)
└── server.js                 # App server bootstrapper (Initializes DB schema then listens)
```

---

## 📋 Database Schema

### `github_profiles`
Stores the core profile attributes and calculated advanced stats.

| Field Name | Data Type | Key / Attribute |
| :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `github_id` | `INT` | `UNIQUE NOT NULL` |
| `username` | `VARCHAR(255)` | `UNIQUE NOT NULL` |
| `name` | `VARCHAR(255)` | - |
| `bio` | `TEXT` | - |
| `followers` | `INT` | `DEFAULT 0` |
| `following_count` | `INT` | `DEFAULT 0` |
| `public_repos` | `INT` | `DEFAULT 0` |
| `public_gists` | `INT` | `DEFAULT 0` |
| `account_created_at` | `DATETIME` | `NOT NULL` |
| `account_age_days` | `INT` | `DEFAULT 0` |
| `follower_to_following_ratio` | `DECIMAL(10,2)` | `DEFAULT 0.00` |
| `popularity_score` | `DECIMAL(10,2)` | `DEFAULT 0.00` |
| `developer_tier` | `VARCHAR(10)` | `DEFAULT 'Tier C'` |
| `total_stars` | `INT` | `DEFAULT 0` |
| `total_forks` | `INT` | `DEFAULT 0` |
| `most_used_language` | `VARCHAR(100)` | `DEFAULT 'Unknown'` |
| `activity_score` | `DECIMAL(10,2)` | `DEFAULT 0.00` |
| `avatar_url` | `VARCHAR(500)` | - |
| `profile_url` | `VARCHAR(500)` | - |
| `analyzed_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` |

### `repositories`
Stores top 5 repositories linked back to the profile record.

| Field Name | Data Type | Key / Attribute |
| :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `github_profile_id` | `INT` | `FOREIGN KEY` references `github_profiles(id) ON DELETE CASCADE` |
| `repo_name` | `VARCHAR(255)` | `NOT NULL` |
| `stars` | `INT` | `DEFAULT 0` |
| `forks` | `INT` | `DEFAULT 0` |
| `language` | `VARCHAR(100)` | `DEFAULT 'Unknown'` |
| `repo_url` | `VARCHAR(500)` | - |

---

## ⚙️ Environment Variables

Create a file named `.env` in the root folder of the project:

```env
# Application configuration
PORT=5000

# Full Database connection URL (Highest Priority, e.g. Railway link)
DATABASE_URL=mysql://root:password@shinkansen.proxy.rlwy.net:58911/railway

# Fallback DB parameters (Used if DATABASE_URL is empty)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=github_analyzer

# Optional: GitHub API Token (Recommended to prevent API rate limits)
# Get a personal token at: https://github.com/settings/tokens
GITHUB_TOKEN=your_personal_github_token_here
```

---

## ⚙️ Setup and Installation

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher recommended)
* [MySQL Server](https://dev.mysql.com/downloads/installer/) (if running database locally) OR a hosted database (like Railway)

### Standard Installation Steps

1. **Extract/Clone the code** and enter the folder:
   ```bash
   cd "Node js project 2"
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Configure the `.env` settings**:
   Fill in your MySQL connection credentials inside the `.env` file (you can keep the predefined Railway link if you want to use that directly!).

4. **Run in development mode** (supports hot-reloading with nodemon):
   ```bash
   npm run dev
   ```

5. **Start in production mode**:
   ```bash
   npm start
   ```

---

## 🐳 Docker Deployment Setup

If you prefer running the entire app (with a fresh local MySQL instance) inside containers, simply follow these steps:

1. **Ensure Docker is installed and running** on your system.
2. **Build and spin up the services** by running:
   ```bash
   docker-compose up --build
   ```
3. The API server will boot up automatically on [http://localhost:5000](http://localhost:5000) and the database will be created.

---

## ⚡ API Endpoint Guides

### 1. Analyze and Store a Developer Profile
Trigger a full scan of a GitHub user. Calculates all custom statistics and saves/updates them in the database.

* **URL**: `/api/github/analyze/:username`
* **Method**: `GET`
* **Headers**: `Content-Type: application/json`
* **Sample Request**:
  `GET /api/github/analyze/torvalds`

* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile analyzed and saved successfully",
    "data": {
      "id": 1,
      "github_id": 102422,
      "username": "torvalds",
      "name": "Linus Torvalds",
      "bio": "The creator of Linux and Git.",
      "followers": 194000,
      "following_count": 0,
      "public_repos": 7,
      "public_gists": 0,
      "account_created_at": "2009-07-03T15:18:07.000Z",
      "account_age_days": 6172,
      "follower_to_following_ratio": 194000,
      "popularity_score": 1940085,
      "developer_tier": "Tier S",
      "total_stars": 85,
      "total_forks": 120,
      "most_used_language": "C",
      "activity_score": 247,
      "avatar_url": "https://avatars.githubusercontent.com/u/102422?v=4",
      "profile_url": "https://github.com/torvalds",
      "analyzed_at": "2026-05-27T16:00:00.000Z",
      "top_repositories": [
        {
          "repo_name": "linux",
          "stars": 160000,
          "forks": 49000,
          "language": "C",
          "repo_url": "https://github.com/torvalds/linux"
        }
      ]
    }
  }
  ```

---

### 2. Get All Stored Analyses (with Filters, Pagination, Sorting, Search)
List previously analyzed profiles with flexible queries.

* **URL**: `/api/github/profiles`
* **Method**: `GET`
* **Sample Request**:
  `GET /api/github/profiles?page=1&limit=10&search=tor&tier=S&sortBy=popularity_score&sortOrder=DESC`

* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profiles retrieved successfully",
    "data": [
      {
        "id": 1,
        "github_id": 102422,
        "username": "torvalds",
        "name": "Linus Torvalds",
        "bio": "The creator of Linux and Git.",
        "followers": 194000,
        "following_count": 0,
        "public_repos": 7,
        "public_gists": 0,
        "account_created_at": "2009-07-03T15:18:07.000Z",
        "account_age_days": 6172,
        "follower_to_following_ratio": 194000,
        "popularity_score": 1940085,
        "developer_tier": "Tier S",
        "total_stars": 85,
        "total_forks": 120,
        "most_used_language": "C",
        "activity_score": 247,
        "avatar_url": "https://avatars.githubusercontent.com/u/102422?v=4",
        "profile_url": "https://github.com/torvalds",
        "analyzed_at": "2026-05-27T16:00:00.000Z"
      }
    ],
    "pagination": {
      "total_items": 1,
      "total_pages": 1,
      "current_page": 1,
      "limit": 10
    }
  }
  ```

---

### 3. Get Stored Details of a Single Developer
Retrieves full details and top repositories for a specific user from the database.

* **URL**: `/api/github/profiles/:username`
* **Method**: `GET`
* **Sample Request**:
  `GET /api/github/profiles/torvalds`

---

### 4. Delete Profile Analysis
Removes a developer profile and their repo list from the MySQL database.

* **URL**: `/api/github/profiles/:username`
* **Method**: `DELETE`
* **Sample Request**:
  `DELETE /api/github/profiles/torvalds`

* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile and repositories for user 'torvalds' deleted successfully"
  }
  ```

---

## 🛡️ Future Improvements

* **Redis Cache**: Introduce Redis caching to hold analysis details for 1 hour, avoiding redundant database querying.
* **Cron Job**: Set up a scheduler utilizing `node-cron` to automatically refresh saved developer profiles from GitHub every 24 hours.
* **Front-end Dashboard**: Build a React/Tailwind frontend showing rank cards, tier charts, and comparative leaderboards.
