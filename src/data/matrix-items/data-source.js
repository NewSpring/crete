import RockApolloDataSource from '@apollosproject/rock-apollo-data-source';

export default class MatrixItem extends RockApolloDataSource {
  expanded = true;

  getItemsFromGuid = async (matrixItemGuid) =>
    matrixItemGuid
      ? this.request('/AttributeMatrixItems')
          .filter(`AttributeMatrix/Guid eq guid'${matrixItemGuid}'`)
          .get()
      : [];
}
