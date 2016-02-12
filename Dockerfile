FROM node

# Define working directory
WORKDIR /opt/app

# Install top dependencies w/ caching
COPY package.json /opt/app/package.json
RUN npm install --silent

# Bundle source
COPY . /opt/app

# Create volume for compiled UI components
VOLUME /opt/app/src/static
# Expose port 8080
EXPOSE 8080
# Define default command.
CMD ["node", "index.js"]
