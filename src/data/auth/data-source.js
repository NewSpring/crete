import { Auth as baseAuth } from '@apollosproject/data-connector-rock';

export default class Auth extends baseAuth.dataSource {
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
