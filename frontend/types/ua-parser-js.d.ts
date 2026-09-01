declare module "ua-parser-js" {
  export interface UAParserResult {
    browser: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { model?: string; type?: string; vendor?: string };
  }

  export class UAParser {
    constructor(userAgent?: string);
    getResult(): UAParserResult;
  }
}
