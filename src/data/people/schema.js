import { Person } from '@apollosproject/data-connector-rock';
import gql from 'graphql-tag';

const peopleSchema = gql`
  ${Person.schema}

  extend type Person {
    impersonationParameter: String! @deprecated(reason: "No longer used.")
    isGroupLeader: Boolean
    isStaff: Boolean
  }

  extend type Query {
    forgotPasswordURL: String
  }
`;

export default peopleSchema;
