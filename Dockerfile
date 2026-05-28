# Use standard official lightweight Node.js Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package descriptors first to take advantage of Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code files
COPY . .

# Expose server listener port
EXPOSE 5000

# Define start command
CMD ["npm", "start"]
