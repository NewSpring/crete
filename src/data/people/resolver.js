import { Person as originalPerson } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';
import ApollosConfig from '@apollosproject/config';

const { ROCK } = ApollosConfig;

const resolver = {
  Query: {
    forgotPasswordURL: () => ROCK.FORGOT_PASSWORD_URL,
  },
  Person: {
    // deprecated
    impersonationParameter: () => 'deprecatedtoken',
    isGroupLeader: async ({ originId }, args, { dataSources: { Group } }) => {
      const groups = await Group.getByPerson({
        personId: originId,
        asLeader: true,
      });
      return groups.length > 0;
    },
    isStaff: ({ originId }, args, { dataSources: { RockPerson } }) =>
      RockPerson.isStaff(originId),
  },
};
export default resolverMerge(resolver, originalPerson);
