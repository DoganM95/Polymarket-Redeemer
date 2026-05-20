FROM node:alpine

# Set work directory
WORKDIR /app

# Install tools
RUN apk add --no-cache expect

# Copy dependency files first for better cache
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy only the source code needed, dockerignore handles exclusions
COPY config.js entrypoint.sh keyManager.js rateLimiter.js redeem_cli.py redeem.js requirements.txt tsconfig.json./
COPY src/ ./src

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Run app
ENTRYPOINT [ "./entrypoint.sh" ]
