import { Auth as baseAuth } from '@apollosproject/data-connector-rock';

export default class Auth extends baseAuth.dataSource {
  baseAuthenticate = baseAuth.authenticate;

  authenticate = ({ identity, ...creds }) => {
    // strip off email part of staff logins for Active Directory
    const newspringUsername = identity.includes('@newspring.cc')
      ? identity.split('@')[0]
      : identity;

    this.baseAuthenticate({ identity: newspringUsername, ...creds });
  };
}
