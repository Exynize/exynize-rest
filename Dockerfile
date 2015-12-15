FROM node

# Define working directory
WORKDIR /opt/app

# Install top dependencies w/ caching
COPY package.json /opt/app/package.json
RUN npm install --silent

# Install sub dependencies w/ caching
COPY src/client/package.json /opt/app/src/client/package.json
COPY src/vm/package.json /opt/app/src/vm/package.json
COPY .babelrc /opt/app/.babelrc
COPY setup.js /opt/app/setup.js
RUN ./node_modules/.bin/babel-node setup.js

# Bundle source
COPY . /opt/app

# Expose port 8080
EXPOSE 8080
# Define default command.
CMD ["node", "index.js"]
