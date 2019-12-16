import { Auth as baseAuth } from '@apollosproject/data-connector-rock';
import { AuthenticationError } from 'apollo-server';

export default class Auth extends baseAuth.dataSource {
  getCurrentPerson = async ({ cookie = null } = { cookie: null }) => {
    const { rockCookie, currentPerson } = this.context;
    const userCookie = cookie || rockCookie;

    if (currentPerson) {
      return currentPerson;
    }

    if (userCookie) {
      try {
        const request = await this.request('People/GetCurrentPerson').get({
          options: {
            headers: { cookie: userCookie, 'Authorization-Token': null },
          },
        });
        this.context.currentPerson = request;
        return request;
      } catch (e) {
        throw new AuthenticationError(
          `Invalid user cookie. New cookie: ${cookie}. Existing cookie: ${rockCookie}. Rock error: ${e.message}`
        );
      }
    }
    throw new AuthenticationError('Must be logged in');
  };

  authenticate = async ({ identity, password }) => {
    // strip off email part of staff logins for Active Directory
    const newspringUsername = identity.includes('@newspring.cc')
      ? identity.split('@')[0]
      : identity;
    const cookie = await this.fetchUserCookie(newspringUsername, password);
    const sessionId = await this.createSession({ cookie });
    const token = baseAuth.generateToken({ cookie, sessionId });
    const { userToken, rockCookie } = baseAuth.registerToken(token);
    this.context.rockCookie = rockCookie;
    this.context.userToken = userToken;
    this.context.sessionId = sessionId;
    return { token, rockCookie };
  };
}
