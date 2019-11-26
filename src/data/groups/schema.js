import gql from 'graphql-tag';

export const groupSchema = gql`
  enum GROUP_TYPE {
    Serving
    Community
    Family
    Fuse
    Rally
  }

  type Group implements Node {
    id: ID!
    name: String
    leader: Person @deprecated(reason: "No longer used, use 'leaders' instead")
    leaders: [Person]
    members: [Person]
  }

  extend type Person {
    groups(type: GROUP_TYPE, asLeader: Boolean): [Group]
  }
`;

export default groupSchema;
