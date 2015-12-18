FROM node

# Define working directory
WORKDIR /opt/app

# Install top dependencies w/ caching
COPY package.json /opt/app/package.json
RUN npm install --silent

# Bundle source
COPY . /opt/app

# Expose port 8080
EXPOSE 8080
# Define default command.
CMD ["node", "index.js"]
