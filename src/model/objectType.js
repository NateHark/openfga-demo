export default class ObjectType {
  static Customer = new ObjectType('customer');
  static Group = new ObjectType('group');
  static User = new ObjectType('user');
  static Folder = new ObjectType('folder');
  static Report = new ObjectType('report');

  constructor(name) {
    this.name = name;
  }

  getObjectId(externalId) {
    if (!externalId) throw new Error(`externalId cannot be null`);
    return `${this.name}:${externalId}`;
  }

  getExternalId(objectId) {
    if (!objectId) throw new Error(`obojectId cannot be null`);
    let [objectType, externalId] = objectId.split(':');
    if (objectType !== this.name) {
      throw new Error(`Unexpected objectType ${objectType}, expected ${this.name}`);
    }
    return externalId;
  }

  getTypePrefix() {
    return `${this.name}:`;
  }
}
