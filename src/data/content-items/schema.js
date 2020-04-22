import { ContentItem } from '@apollosproject/data-connector-rock';
import gql from 'graphql-tag';

export default gql`
  ${ContentItem.schema}

  type SeriesConnection {
    series: ContentItem
    itemCount: Int
    itemIndex(id: String): Int
  }

  type SermonNoteComment {
    id: ID!
    text: String
  }

  interface SermonNote {
    id: ID!
    allowsComment: Boolean
    comment: SermonNoteComment @cacheControl(maxAge: 0)
  }

  type TextNote implements SermonNote {
    id: ID!
    allowsComment: Boolean
    comment: SermonNoteComment @cacheControl(maxAge: 0)

    text: String
    isHeader: Boolean
  }

  type ScriptureNote implements SermonNote {
    id: ID!
    allowsComment: Boolean
    comment: SermonNoteComment @cacheControl(maxAge: 0)

    scripture: Scripture
  }

  extend type WeekendContentItem {
    communicator: Person @deprecated(reason: "Use communicators")
    communicators: [Person]
    guestCommunicators: [String]
    sermonDate: String
    series: ContentItem @deprecated(reason: "Use seriesConnection")
    seriesConnection: SeriesConnection
    sermonNotes: [SermonNote]
  }

  extend type DevotionalContentItem {
    series: ContentItem @deprecated(reason: "Use seriesConnection")
    seriesConnection: SeriesConnection
  }

  extend type VideoMedia {
    thumbnail: ImageMedia
  }

  extend type Query {
    contentItemFromSlug(slug: String!): ContentItem
  }

  extend type Mutation {
    saveSermonNoteComment(
      contentID: ID!
      parentID: ID!
      text: String
    ): SermonNoteComment
  }
`;
