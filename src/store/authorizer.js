import 'dotenv/config';
import ObjectType from '../model/objectType';
import { OpenFgaApi } from '@openfga/sdk';

const OPENFGA_API_SCHEME = process.env['OPENFGA_API_SCHEME'];
const OPENFGA_API_HOST = process.env['OPENFGA_API_HOST'];
const OPENFGA_API_PORT = process.env['OPENFGA_API_PORT'];

const authorizationModel = {
  type_definitions: [
    {
      type: ObjectType.Customer.name,
      relations: {
        member: {
          this: {},
        },
      },
    },
    {
      type: ObjectType.Group.name,
      relations: {
        owner: {
          this: {},
        },
        member: {
          this: {},
        },
      },
    },
    {
      type: ObjectType.Folder.name,
      relations: {
        viewer: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'editor',
                },
              },
            ],
          },
        },
        editor: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'admin',
                },
              },
            ],
          },
        },
        admin: {
          this: {},
        },
      },
    },
    {
      type: ObjectType.Report.name,
      relations: {
        parent: {
          this: {},
        },
        viewer: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'editor',
                },
              },
              {
                tupleToUserset: {
                  tupleset: {
                    object: '',
                    relation: 'parent',
                  },
                  computedUserset: {
                    object: '',
                    relation: 'viewer',
                  },
                },
              },
            ],
          },
        },
        editor: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'admin',
                },
              },
              {
                tupleToUserset: {
                  tupleset: {
                    object: '',
                    relation: 'parent',
                  },
                  computedUserset: {
                    object: '',
                    relation: 'editor',
                  },
                },
              },
            ],
          },
        },
        admin: {
          union: {
            child: [
              {
                this: {},
              },
              {
                tupleToUserset: {
                  tupleset: {
                    object: '',
                    relation: 'parent',
                  },
                  computedUserset: {
                    object: '',
                    relation: 'admin',
                  },
                },
              },
            ],
          },
        },
      },
    },
  ],
};

export default class Authorizer {
  /**
   * Static factory
   * @param {string} customerId
   * @returns {Authorizer}
   */
  static async initAuthorizer(customerId) {
    // Create a temporary client used for initialization
    const client = new OpenFgaApi({
      apiScheme: OPENFGA_API_SCHEME,
      apiHost: `${OPENFGA_API_HOST}:${OPENFGA_API_PORT}`,
    });

    const store = await client.createStore({
      name: customerId,
    });

    return new Authorizer(store.id);
  }

  /**
   * Private constructor
   * @param {string} storeId
   * @private
   */
  constructor(storeId) {
    this.client = new OpenFgaApi({
      apiScheme: OPENFGA_API_SCHEME,
      apiHost: `${OPENFGA_API_HOST}:${OPENFGA_API_PORT}`,
      storeId: storeId,
    });
  }

  /**
   * Available for unit tests only
   * @private
   */
  async deleteStore() {
    await this.client.deleteStore();
  }

  /**
   * Handles read() request pagination
   * @private
   */
  async readTuples(request, pageToken = null) {
    let tuples = [];
    const response = await this.client.read({ ...request, continuation_token: pageToken });
    tuples = [...tuples, ...response.tuples];
    if (response.continuation_token) {
      tuples = [...tuples, ...(await this.readTuples(request, response.continuation_token))];
    }
    return tuples;
  }

  async addUserToCustomer(userId, customerId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: ObjectType.User.getObjectId(userId),
            relation: 'member',
            object: ObjectType.Customer.getObjectId(customerId),
          },
        ],
      },
    });
  }

  async getUsersForCustomer(customerId) {
    const tuples = await this.readTuples({
      tuple_key: {
        relation: 'member',
        object: ObjectType.Customer.getObjectId(customerId),
      },
    });

    return tuples.map((tuple) => ObjectType.User.getExternalId(tuple.key.user));
  }

  async getCustomersForUser(userId) {
    const tuples = await this.readTuples({
      tuple_key: {
        user: ObjectType.User.getObjectId(userId),
        relation: 'member',
        object: ObjectType.Customer.getTypePrefix(),
      },
    });

    return tuples.map((tuple) => ObjectType.Customer.getExternalId(tuple.key.object));
  }

  async addGroupToCustomer(groupId, customerId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: ObjectType.Customer.getObjectId(customerId),
            relation: 'owner',
            object: ObjectType.Group.getObjectId(groupId),
          },
        ],
      },
    });
  }

  async getGroupsForCustomer(customerId) {
    const tuples = await this.readTuples({
      tuple_key: {
        user: ObjectType.Customer.getObjectId(customerId),
        relation: 'owner',
        object: ObjectType.Group.getTypePrefix(),
      },
    });

    return tuples.map((tuple) => ObjectType.Group.getExternalId(tuple.key.object));
  }

  async addUserToGroup(userId, groupId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: ObjectType.User.getObjectId(userId),
            relation: 'member',
            object: ObjectType.Group.getObjectId(groupId),
          },
        ],
      },
    });
  }

  async getGroupsForUser(userId) {
    const tuples = await this.readTuples({
      tuple_key: {
        user: ObjectType.User.getObjectId(userId),
        relation: 'member',
        object: ObjectType.Group.getTypePrefix(),
      },
    });

    return tuples.map((tuple) => ObjectType.Group.getExternalId(tuple.key.object));
  }

  async getGroupMembers(groupId) {
    const tuples = await this.readTuples({
      tuple_key: {
        relation: 'member',
        object: ObjectType.Group.getObjectId(groupId),
      },
    });

    return tuples.map((tuple) => ObjectType.User.getExternalId(tuple.key.user));
  }

  async shareObjectToUser(userId, role, objectType, objectId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: ObjectType.User.getObjectId(userId),
            relation: role.name,
            object: objectType.getObjectId(objectId),
          },
        ],
      },
    });
  }

  async userHasRole(userId, role, objectType, objectId) {
    const { allowed } = await this.client.check({
      tuple_key: {
        user: ObjectType.User.getObjectId(userId),
        relation: role.name,
        object: objectType.getObjectId(objectId),
      },
    });

    return allowed;
  }

  async shareObjectToGroup(groupId, role, objectType, objectId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: ObjectType.Group.getObjectId(groupId) /* the group directly */,
            relation: role.name,
            object: objectType.getObjectId(objectId),
          },
          {
            user: `${ObjectType.Group.getObjectId(groupId)}#member` /* all group members */,
            relation: role.name,
            object: objectType.getObjectId(objectId),
          },
        ],
      },
    });
  }

  async setObjectParent(objectType, objectId, parentObjectType, parentObjectId) {
    await this.client.write({
      writes: {
        tuple_keys: [
          {
            user: parentObjectType.getObjectId(parentObjectId) /* the parent object */,
            relation: 'parent',
            object: objectType.getObjectId(objectId),
          },
        ],
      },
    });
  }

  async groupHasRole(groupId, role, objectType, objectId) {
    const { allowed } = await this.client.check({
      tuple_key: {
        user: ObjectType.Group.getObjectId(groupId),
        relation: role.name,
        object: objectType.getObjectId(objectId),
      },
    });

    return allowed;
  }

  async getStore() {
    return this.client.getStore();
  }

  async updateAuthorizationModel() {
    return await this.client.writeAuthorizationModel(authorizationModel);
  }
}
