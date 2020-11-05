import { ActionAlgorithm } from '@apollosproject/data-connector-rock';

const { schema, resolver } = ActionAlgorithm;

class dataSource extends ActionAlgorithm.dataSource {
  ACTION_ALGORITHMS = {
    ...this.ACTION_ALGORITHMS,
    STAFF_NEWS: this.contentChannelAlgorithm.bind(this),
  };
}

export { dataSource, schema, resolver };
