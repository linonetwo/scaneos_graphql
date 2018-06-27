// @flow
import express from 'express';
import bodyParser from 'body-parser';
import { importSchema } from 'graphql-import';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { ApolloEngine } from 'apollo-engine';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from './resolvers';
// Import schema.graphql by relative path to where we run "yarn start"
const typeDefs = importSchema('./server/schema.graphql');
// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Initialize the app
const app = express();

// The GraphQL data endpoint
app.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress({
    schema,
    context: {},
    tracing: true,
    cacheControl: true,
  }),
);
// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: process.env.NODE_ENV === 'production' ? '/gqapi/graphql' : '/graphql' }));

const engine = new ApolloEngine({
  apiKey: 'service:scaneos_web:v8pNxtRwdTZDemJWuGw6HA',
});
engine.listen(
  {
    port: 3000,
    expressApp: app,
  },
  () => {
    console.log(
      'GraphQL Gateway running in http://localhost:3000/graphiql\nAnd you can try http://localhost:3000/graphiql to run queries!',
    );
  },
);
