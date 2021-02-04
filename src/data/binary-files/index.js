import FormData from 'form-data';
import { BinaryFiles } from '@apollosproject/data-connector-rock';

class dataSource extends BinaryFiles.dataSource {
  async uploadFile({ stream }) {
    const data = new FormData();

    data.append('file', stream);

    const response = await this.nodeFetch(
      `${this.baseURL}/BinaryFiles/Upload?binaryFileTypeId=5`,
      {
        method: 'POST',
        body: data,
        agent: this.agent,
        headers: {
          'Authorization-Token': this.rockToken,
          ...data.getHeaders(),
        },
      }
    );

    return response.text();
  }
}

const { resolver } = BinaryFiles;

export { resolver, dataSource };
