// @flow
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { importSchema } from 'graphql-import';
import { graphqlExpress } from 'apollo-server-express';
import graphqlPlayground from 'graphql-playground-middleware-express';
import { ApolloEngine } from 'apollo-engine';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from './resolvers';
// Import schema.graphql by relative path to where we run "yarn start"
const typeDefs = importSchema('./server/graphql/schema.graphql');
// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Initialize the app
const app = express();

// The GraphQL data endpoint
const whitelist = ['http://localhost:3000'];
const corsOptions = {
  origin(origin, callback) {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  },
  credentials: true,
};
app.use(
  '/graphql',
  cors(corsOptions),
  bodyParser.json(),
  graphqlExpress({
    schema,
    context: {},
    tracing: true,
    cacheControl: true,
  }),
);
// GraphiQL, a visual editor for queries
app.use(
  '/graphiql',
  graphqlPlayground({ endpoint: process.env.NODE_ENV === 'production' ? '/gqapi/graphql' : '/graphql' }),
);

const engine = new ApolloEngine({
  apiKey: 'service:scaneos_web:v8pNxtRwdTZDemJWuGw6HA',
});
engine.listen(
  {
    port: 3002,
    expressApp: app,
  },
  () => {
    console.log(
      'GraphQL Gateway running in http://localhost:3002/graphiql\nAnd you can try http://localhost:3002/graphiql to run queries!',
    );
  },
);
