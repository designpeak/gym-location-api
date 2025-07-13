const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema');

const app = express();

app.use('/teretane', graphqlHTTP({
  schema,
  graphiql: true
}));

app.listen(3000, () => console.log('GraphQL API na http://localhost:3000/teretane'));
