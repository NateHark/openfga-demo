export default class Permission {
  static ReportDrilldown = new Permission('report_drilldown');

  constructor(name) {
    this.name = name;
  }
}
