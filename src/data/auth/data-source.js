import { Auth as baseAuth } from '@apollosproject/data-connector-rock';
import { fetch, Request } from 'apollo-server-env';
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
    throw new AuthenticationError(
      `getCurrentPerson failed. No cookie. User token: ${this.context.userToken}, Session ID: ${this.context.sessionId}`
    );
  };

  fetchUserCookie = async (Username, Password) => {
    try {
      // We use `new Response` rather than string/options b/c if conforms more closely with ApolloRESTDataSource
      // (makes mocking in tests WAY easier to use `new Request` as an input in both places)
      const response = await fetch(
        new Request(`${this.baseURL}/Auth/Login`, {
          method: 'POST',
          body: JSON.stringify({
            Username,
            Password,
            Persisted: true,
          }),
          headers: {
            'Content-Type': 'Application/Json',
          },
        })
      );
      if (response.status >= 400) throw new AuthenticationError();
      const cookie = response.headers.get('set-cookie');
      return cookie;
    } catch (err) {
      throw new AuthenticationError('Invalid Credentials');
    }
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
