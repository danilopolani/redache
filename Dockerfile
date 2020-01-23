FROM node:12

# Create app directory
WORKDIR /app

# Copy yarn deps
COPY package.json .
COPY yarn.lock .

# Install app dependencies
RUN yarn

# Copy project folder in the container
COPY . .

CMD ["./node_modules/nyc/bin/nyc.js", "--reporter=lcov", "./node_modules/mocha/bin/_mocha", "--colors", "--exit"]
