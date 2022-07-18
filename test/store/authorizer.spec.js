import Authorizer from '../../src/store/authorizer';
import ObjectType from '../../src/model/objectType';
import Role from '../../src/model/role';
import uniqueId from '../../src/util/idGenerator';

describe('authorizer tests', () => {
  const customerId = 'vareto';

  afterEach(async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.deleteStore();
  });

  test('initAuthorizer', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    const store = await authorizer.getStore();
    expect(store.name).toBe(customerId);
  });

  test('updateAuthorizationModel', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    const authModelId = await authorizer.updateAuthorizationModel();
    expect(authModelId).not.toBeNull();
  });

  test('addUserToCustomer', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const userIds = [...new Array(101)].map((value) => uniqueId('user'));
    for (const userId of userIds) {
      await authorizer.addUserToCustomer(userId, customerId);
    }

    let users = await authorizer.getUsersForCustomer(customerId);
    expect(users).toHaveLength(101);
    expect(users).toEqual(expect.arrayContaining(userIds));

    users = await authorizer.getUsersForCustomer('bogusCustomerId');
    expect(users).toHaveLength(0);
  });

  test('getCustomersForUser', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const userId = uniqueId('user');
    await authorizer.addUserToCustomer(userId, customerId);

    const customers = await authorizer.getCustomersForUser(userId);
    expect(customers).toHaveLength(1);
    expect(customers).toEqual(expect.arrayContaining([customerId]));
  });

  test('addGroupToCustomer', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const groupId = uniqueId('group');
    await authorizer.addGroupToCustomer(groupId, customerId);

    await expect(authorizer.getGroupsForCustomer(customerId)).resolves.toEqual(expect.arrayContaining([groupId]));
  });

  test('addUserToGroup', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const groupId = uniqueId('group');
    const userId = uniqueId('user');
    await authorizer.addUserToGroup(userId, groupId);

    await expect(authorizer.getGroupsForUser(userId)).resolves.toEqual(expect.arrayContaining([groupId]));
    await expect(authorizer.getGroupMembers(groupId)).resolves.toEqual(expect.arrayContaining([userId]));
  });

  test('shareObjectToUser', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const viewerUserId = uniqueId('user');
    const editorUserId = uniqueId('user');
    const adminUserId = uniqueId('user');
    const folderId = uniqueId('folder');

    await authorizer.shareObjectToUser(viewerUserId, Role.Viewer, ObjectType.Folder, folderId);
    await expect(authorizer.userHasRole(viewerUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(viewerUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(false);
    await expect(authorizer.userHasRole(viewerUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);

    await authorizer.shareObjectToUser(editorUserId, Role.Editor, ObjectType.Folder, folderId);
    await expect(authorizer.userHasRole(editorUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(editorUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(editorUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);

    await authorizer.shareObjectToUser(adminUserId, Role.Admin, ObjectType.Folder, folderId);
    await expect(authorizer.userHasRole(adminUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(adminUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(adminUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(true);
  });
});
