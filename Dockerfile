FROM node

# Define working directory
WORKDIR /opt/app
# Expose port 8080
EXPOSE 8080

# Install top dependencies w/ caching
ADD package.json /opt/app/package.json
RUN npm install --silent

# Install sub dependencies w/ caching
ADD src/client/package.json /opt/app/src/client/package.json
ADD src/vm/package.json /opt/app/src/vm/package.json
ADD config.js /opt/app/config.js
ADD config.js.example /opt/app/config.js.example
ADD .babelrc /opt/app/.babelrc
ADD setup.js /opt/app/setup.js
RUN ./node_modules/.bin/babel-node setup.js

# Bundle source
ADD . /opt/app

# Define default command.
CMD ["node", "index.js"]
