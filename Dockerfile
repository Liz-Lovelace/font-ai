FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

COPY assets/ ./assets/
COPY mock_image.png ./

# Copy the rest of the application
COPY . .

# Command to run the application
CMD ["npm", "start"] 