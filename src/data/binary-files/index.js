import { BinaryFiles } from '@apollosproject/data-connector-rock';

class dataSource extends BinaryFiles.dataSource {
  willSendRequest(request) {
    this.callCount += 1;
    if (!this.calls[request.path]) {
      this.calls[request.path] = 0;
    }
    this.calls[request.path] += 1;

    if (!request.headers.has('Authorization-Token')) {
      request.headers.set('Authorization-Token', this.rockToken);
    }
    request.headers.set('user-agent', 'Apollos');
    request.headers.set('Content-Type', 'application/json');
    // Use an HTTP agent for keepAlive
    // if (get(ROCK, 'USE_AGENT', true)) {
    //   request.agent = ROCK_AGENT;
    // }
  }
}

const { resolver } = BinaryFiles;

export { resolver, dataSource };
