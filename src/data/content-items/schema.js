import { contentItemSchema } from '@apollosproject/data-schema';
import gql from 'graphql-tag';

export default gql`
  ${contentItemSchema}

  type SeriesConnection {
    series: ContentItem
    itemCount: Int
    itemIndex(id: String): Int
  }

  type NotesBlockComment {
    id: ID!
    text: String
  }

  interface NotesBlock {
    id: ID!
    allowsComment: Boolean
    comment: NotesBlockComment @cacheControl(maxAge: 0)
    simpleText: String
  }

  type NotesTextBlock implements NotesBlock {
    id: ID!
    allowsComment: Boolean
    comment: NotesBlockComment @cacheControl(maxAge: 0)
    simpleText: String

    isHeader: Boolean
    hasBlanks: Boolean
    hiddenText: String
  }

  type NotesScriptureBlock implements NotesBlock {
    id: ID!
    allowsComment: Boolean
    comment: NotesBlockComment @cacheControl(maxAge: 0)
    simpleText: String

    scripture: Scripture
  }

  extend type WeekendContentItem {
    communicators: [Person]
    guestCommunicators: [String]
    sermonDate: String
    seriesConnection: SeriesConnection
    sermonNotes: [NotesBlock] @cacheControl(maxAge: 0)
  }

  extend type DevotionalContentItem {
    seriesConnection: SeriesConnection
  }

  extend type VideoMedia {
    thumbnail: ImageMedia
  }

  extend type Query {
    contentItemFromSlug(slug: String!): ContentItem
  }

  extend type Mutation {
    saveNotesComment(
      contentID: ID!
      blockID: ID!
      text: String
    ): NotesBlockComment
  }
`;
