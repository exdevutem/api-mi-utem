FROM node:latest

# Set working directory to /app
WORKDIR /app

# Copy everything from the current directory to /app
COPY . /app

# Install dependencies
RUN yarn install

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
