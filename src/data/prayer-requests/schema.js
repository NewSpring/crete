import gql from 'graphql-tag';

const prayerRequestSchema = gql`
  extend type Query {
    prayers(type: PrayerType): [PrayerRequest]
    campusPrayers: [PrayerRequest]
    userPrayers: [PrayerRequest]
    groupPrayers: [PrayerRequest]
    savedPrayers: [PrayerRequest]
  }
  extend type Mutation {
    addPrayer(text: String!, isAnonymous: Boolean): PrayerRequest
    deletePrayer(nodeId: String!): PrayerRequest
    incrementPrayerCount(nodeId: String!): PrayerRequest
    flagPrayer(nodeId: String!): PrayerRequest
    savePrayer(nodeId: String!): PrayerRequest
    unSavePrayer(nodeId: String!): PrayerRequest
  }

  enum PrayerType {
    CAMPUS
    USER
    GROUP
    SAVED
  }

  type PrayerRequest implements Node {
    id: ID!
    firstName: String
      @deprecated(reason: "Not supported. Use requestor.firstName")
    lastName: String
      @deprecated(reason: "Not supported. Use requestor.lastName.")
    text: String!
    enteredDateTime: String!
      @deprecated(reason: "Not supported. Use startTime.")
    startTime: String!
    flagCount: Int
    prayerCount: Int
    categoryId: Int @deprecated(reason: "Not supported")
    campus: Campus @deprecated(reason: "Not supported")
    createdByPersonAliasId: Int @deprecated(reason: "Not supported")
    requestedByPersonAliasId: Int @deprecated(reason: "Not supported")
    person: Person @deprecated(reason: "Not supported. Use requestor.")
    requestor: Person
    isAnonymous: Boolean
    isSaved: Boolean
  }
`;

export default prayerRequestSchema;
