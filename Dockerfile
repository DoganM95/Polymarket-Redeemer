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
COPY entrypoint.sh redeem_cli.py requirements.txt ./
COPY src/ ./src

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Run app
ENTRYPOINT [ "./entrypoint.sh" ]
