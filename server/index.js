// @flow
import express from 'express';
import bodyParser from 'body-parser';
import { importSchema } from 'graphql-import';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
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
    context: { ...api },
    tracing: true,
    cacheControl: true,
  }),
);
// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(3000, () => {
  console.log(
    'GraphQL Gateway running in http://localhost:3000/graphiql\nAnd you can try http://localhost:3000/graphiql to run queries!',
  );
});
