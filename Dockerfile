# Dockerfile.alpine
FROM mhart/alpine-node:10.4.0

# Create app directory
RUN mkdir -p /usr/src/app

# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories
RUN apk add git make gcc g++ python linux-headers paxctl gnupg

# bundle app source
# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json /tmp/package.json
COPY yarn.lock /tmp/yarn.lock
# Use America source since we are ouside GFW
# RUN sed -i 's/registry.npm.taobao.org/registry.npmjs.org/g' /tmp/yarn.lock
RUN cd /tmp && yarn && cp -a /tmp/node_modules /usr/src/app/

# From here we load our application's code in, therefore the previous docker
# "layer" that's been cached will be used if possible
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn build

# Expose port
EXPOSE 3000

CMD ["yarn", "serve"]
