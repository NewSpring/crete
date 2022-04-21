import { Person as originalPerson } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';
import ApollosConfig from '@apollosproject/config';

const { ROCK } = ApollosConfig;

const resolver = {
  Query: {
    forgotPasswordURL: () => ROCK.FORGOT_PASSWORD_URL,
  },
};
export default resolverMerge(resolver, originalPerson);
