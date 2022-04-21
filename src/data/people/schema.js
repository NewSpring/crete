import gql from 'graphql-tag';

const peopleSchema = gql`
  extend type Query {
    forgotPasswordURL: String
  }
`;

export default peopleSchema;
