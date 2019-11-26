import gql from 'graphql-tag';
import { Features } from '@apollosproject/data-connector-rock';

export default gql`
  type NoteFeature implements Feature & Node {
    id: ID!
    order: Int

    placeholder: String
  }

  type HeaderFeature implements Feature & Node {
    id: ID!
    order: Int

    body: String
    sharing: SharableFeature
  }

  ${Features.schema}
`;
