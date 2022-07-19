import Authorizer from '../../src/store/authorizer';
import ObjectType from '../../src/model/objectType';
import Permission from '../../src/model/permission';
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

  test('direct authorization test', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const folderId = uniqueId('folder');

    const viewerGroupId = uniqueId('group');
    const viewerUserId = uniqueId('user');
    await authorizer.addUserToGroup(viewerUserId, viewerGroupId);

    const editorGroupId = uniqueId('group');
    const editorUserId = uniqueId('user');
    await authorizer.addUserToGroup(editorUserId, editorGroupId);

    const adminGroupId = uniqueId('group');
    const adminUserId = uniqueId('user');
    await authorizer.addUserToGroup(adminUserId, adminGroupId);

    await authorizer.shareObjectToGroup(viewerGroupId, Role.Viewer, ObjectType.Folder, folderId);
    // Verify group has expected roles
    await expect(authorizer.groupHasRole(viewerGroupId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(viewerGroupId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(false);
    await expect(authorizer.groupHasRole(viewerGroupId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);
    // Verify user in group has expected roles
    await expect(authorizer.userHasRole(viewerUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(viewerUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(false);
    await expect(authorizer.userHasRole(viewerUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);

    await authorizer.shareObjectToGroup(editorGroupId, Role.Editor, ObjectType.Folder, folderId);
    // Verify group has expected roles
    await expect(authorizer.groupHasRole(editorGroupId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(editorGroupId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(editorGroupId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);
    // Verify user in group has expected roles
    await expect(authorizer.userHasRole(editorUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(editorUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(editorUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);

    await authorizer.shareObjectToGroup(adminGroupId, Role.Admin, ObjectType.Folder, folderId);
    // Verify group has expected roles
    await expect(authorizer.groupHasRole(adminGroupId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(adminGroupId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(adminGroupId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(true);
    // Verify user in group has expected roles
    await expect(authorizer.userHasRole(adminUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(adminUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(adminUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(true);
  });

  test('indirect authorization tests', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const folderId = uniqueId('folder');
    const reportId = uniqueId('report');

    const viewerUserId = uniqueId('user');

    const folderAdminGroupId = uniqueId('group');
    const folderAdminUserId = uniqueId('user');
    await authorizer.addUserToGroup(folderAdminUserId, folderAdminGroupId);

    // Associate the report with the folder
    await authorizer.setObjectParent(ObjectType.Report, reportId, ObjectType.Folder, folderId);

    // Share the folder to the group
    await authorizer.shareObjectToGroup(folderAdminGroupId, Role.Admin, ObjectType.Folder, folderId);

    // Verify group has expected roles on the folder
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(true);
    // Verify user in group has expected roles on the folder
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(true);

    // Verify group has expected roles on the report
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Viewer, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Editor, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.groupHasRole(folderAdminGroupId, Role.Admin, ObjectType.Report, reportId)).resolves.toBe(true);
    // Verify user in group has expected roles on the report
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Viewer, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Editor, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(folderAdminUserId, Role.Admin, ObjectType.Report, reportId)).resolves.toBe(true);

    // Share the report directly to a user
    await authorizer.shareObjectToUser(viewerUserId, Role.Viewer, ObjectType.Report, reportId);

    // Verify the user has expected roles on the report
    await expect(authorizer.userHasRole(viewerUserId, Role.Viewer, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.userHasRole(viewerUserId, Role.Editor, ObjectType.Report, reportId)).resolves.toBe(false);
    await expect(authorizer.userHasRole(viewerUserId, Role.Admin, ObjectType.Report, reportId)).resolves.toBe(false);

    // Verify the user doesn't have access to the folder
    await expect(authorizer.userHasRole(viewerUserId, Role.Viewer, ObjectType.Folder, folderId)).resolves.toBe(false);
    await expect(authorizer.userHasRole(viewerUserId, Role.Editor, ObjectType.Folder, folderId)).resolves.toBe(false);
    await expect(authorizer.userHasRole(viewerUserId, Role.Admin, ObjectType.Folder, folderId)).resolves.toBe(false);
  });

  test('granular permissions tests', async () => {
    const authorizer = await Authorizer.initAuthorizer(customerId);
    await authorizer.updateAuthorizationModel();

    const reportId = uniqueId('report');

    const viewerUserId = uniqueId('user');
    const editorUserId = uniqueId('user');
    const adminUserId = uniqueId('user');

    // Share the users to the report
    await authorizer.shareObjectToUser(viewerUserId, Role.Viewer, ObjectType.Report, reportId);
    await authorizer.shareObjectToUser(editorUserId, Role.Editor, ObjectType.Report, reportId);
    await authorizer.shareObjectToUser(adminUserId, Role.Admin, ObjectType.Report, reportId);

    // Verify editor and admin user has drilldown permission while viewer does not
    await expect(authorizer.userHasPermission(viewerUserId, Permission.ReportDrilldown, ObjectType.Report, reportId)).resolves.toBe(false);
    await expect(authorizer.userHasPermission(editorUserId, Permission.ReportDrilldown, ObjectType.Report, reportId)).resolves.toBe(true);
    await expect(authorizer.userHasPermission(adminUserId, Permission.ReportDrilldown, ObjectType.Report, reportId)).resolves.toBe(true);
  });
});
