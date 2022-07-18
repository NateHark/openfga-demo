export default class Role {
  static Viewer = new Role('viewer');
  static Editor = new Role('editor');
  static Admin = new Role('admin');

  constructor(name) {
    this.name = name;
  }
}
