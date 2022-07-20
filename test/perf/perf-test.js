import Authorizer from '../../src/store/authorizer';
import ObjectType from '../../src/model/objectType';
import Role from '../../src/model/role';
import uniqueId from '../../src/util/idGenerator';

const roles = [Role.Viewer, Role.Editor, Role.Admin];

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

async function createAuthorizer(customerId) {
  const authorizer = await Authorizer.initAuthorizer(customerId);
  await authorizer.updateAuthorizationModel();
  return authorizer;
}

async function writeTuple(authorizer, userId, reportId) {
  await authorizer.shareObjectToUser(userId, Role.Admin, ObjectType.Report, reportId);
}

async function checkAccess(authorizer, userId, reportId) {
  return await authorizer.userHasRole(userId, roles[randomNumber(0, roles.length)], ObjectType.Report, reportId);
}

async function runTest(durationInMins) {
  let successfulWrites = 0;
  let failedWrites = 0;
  let successfulReads = 0;
  let failedReads = 0;

  const start = new Date().getTime();

  const customerId = uniqueId('customer');
  const authorizer = await createAuthorizer(customerId);

  console.log('Running test...');

  while (new Date().getTime() - start < durationInMins * 1000 * 60) {
    const userId = uniqueId('user');
    const reportId = uniqueId('report');
    await writeTuple(authorizer, userId, reportId)
      .then(() => successfulWrites++)
      .catch((e) => failedWrites++);
    await checkAccess(authorizer, userId, reportId)
      .then((result) => (result ? successfulReads++ : failedReads++))
      .catch((e) => failedReads++);
  }

  console.log('Test complete');
  console.log(`Successful Writes: ${successfulWrites}, Successful Reads: ${successfulReads}, Failed Writes: ${failedWrites}, Failed Reads: ${failedReads}`);
  console.log(`Duration: ${durationInMins}m, ops/s: ${(successfulReads + failedReads + successfulWrites + failedWrites) / (durationInMins * 60)}`);
}

const durationInMins = process.env['DURATION_MINS'];

await runTest(durationInMins);
