import { get } from 'lodash';
import { Auth, registerToken } from '@apollosproject/data-connector-rock';
import { report } from '@apollosproject/bugsnag';

export const contextMiddleware = ({ req, context: ctx }) => {
  if (get(req, 'headers.authorization')) {
    const { userToken, rockCookie, sessionId } = Auth.registerToken(
      req.headers.authorization
    );
    if (rockCookie) {
      report(new Error('User Header - Valid'), {
        metaData: {
          userToken,
          rockCookie,
          sessionId,
          header: req.headers.authorization,
        },
        severity: 'warning',
      });
    } else {
      report(new Error('User Header - Invalid'), {
        metaData: {
          userToken,
          rockCookie,
          sessionId,
          header: req.headers.authorization,
        },
        severity: 'warning',
      });
    }
    return {
      ...ctx,
      userToken,
      rockCookie,
      sessionId,
    };
  }
  return ctx;
};

export const authWithLoggingMiddleware = {
  ...Auth,
  contextMiddleware,
};

export { authWithLoggingMiddleware as default };
