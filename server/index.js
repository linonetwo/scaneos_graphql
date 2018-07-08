// @flow
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { importSchema } from 'graphql-import';
import { ApolloServer } from 'apollo-server-express';
import { ApolloEngine } from 'apollo-engine';
import { CMS_TOKEN, GRAPHQL_API } from '../API.config';

import CMS from './dataSources/cms';
import resolvers from './resolvers';
// Import schema.graphql by relative path to where we run "yarn start"
const typeDefs = importSchema('./server/graphql/schema.graphql');

// Initialize the app
const app = express();
const whitelist = ['http://localhost:3000'];
app.use(
  cors({
    origin(origin, callback) {
      const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
      callback(null, originIsWhitelisted);
    },
    credentials: true,
  }),
);
app.use(bodyParser.json());

// The GraphQL data endpoint

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { CMS_TOKEN },
  tracing: true,
  introspection: true,
  dataSources: () => ({
    cms: new CMS(),
  }),
  cacheControl: {
    defaultMaxAge: 5,
    stripFormattedExtensions: false,
    calculateCacheControlHeaders: false,
  },
  engine: false,
});
server.applyMiddleware({ app, gui: true });

const engine = new ApolloEngine({
  apiKey: 'service:scaneos_web:v8pNxtRwdTZDemJWuGw6HA',
});
engine.listen(
  {
    port: 3002,
    expressApp: app,
    graphqlPaths: [process.env.NODE_ENV === 'production' ? '/gqapi/graphql' : '/graphql'],
  },
  () => {
    console.log(`🚀 Server ready at ${GRAPHQL_API} 💹`);
  },
);
