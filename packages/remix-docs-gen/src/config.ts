import * as path from "path";

const remixConfigPath = "remix.config.js";

const remixConfig = require(path.resolve(process.cwd(), remixConfigPath)) as {
  appDirectory?: string;
};

const appDirectory = remixConfig.appDirectory ?? "./app";

export const config = {
  appDirectory,
};
