import { Person as basePerson } from '@apollosproject/data-connector-rock';

export default class Person extends basePerson.dataSource {
  async isStaff(id) {
    const staff = await this.request('GroupMembers')
      // active and not archived
      .filter(
        "GroupId eq 3 and GroupMemberStatus eq '1' and IsArchived eq false"
      )
      .get();
    const staffIds = staff.map(({ personId }) => personId);
    if (!staffIds.includes(id)) return false;
    return true;
  }
}
