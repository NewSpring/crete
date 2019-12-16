import gql from 'graphql-tag';

const prayerRequestSchema = gql`
  extend type Query {
    prayers(type: PrayerType): [PrayerRequest]
    campusPrayers: [PrayerRequest]
      @deprecated(reason: "Use prayers(type:SAVED)")
    userPrayers: [PrayerRequest] @deprecated(reason: "Use prayers(type:USER)")
    groupPrayers: [PrayerRequest] @deprecated(reason: "Use prayers(type:GROUP)")
    savedPrayers: [PrayerRequest]
      @deprecated(reason: "Use prayers(type:CAMPUS)")
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
    firstName: String @deprecated(reason: "Use requestor.firstName")
    lastName: String @deprecated(reason: "Use requestor.lastName.")
    text: String!
    enteredDateTime: String! @deprecated(reason: "Use startTime")
    startTime: String!
    flagCount: Int
    prayerCount: Int
    categoryId: Int @deprecated(reason: "Not supported")
    campus: Campus @deprecated(reason: "Use requestor.campus")
    createdByPersonAliasId: Int @deprecated(reason: "Use requestor")
    requestedByPersonAliasId: Int @deprecated(reason: "Use requestor")
    person: Person @deprecated(reason: "Use requestor")
    requestor: Person
    isAnonymous: Boolean
    isSaved: Boolean
  }
`;

export default prayerRequestSchema;
