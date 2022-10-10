const { execSync } = require("child_process");
const fs = require("fs-extra");

const remixDocsGenName = "remix-docs-gen";

execSync("yarn build");

execSync(`cp README.md packages/${remixDocsGenName}`);

const remixDocsGenJsonPath = `packages/${remixDocsGenName}/package.json`;

const remixDocsGenJson = fs.readJSONSync(remixDocsGenJsonPath);

const configJson = fs.readJSONSync("packages/config/package.json");

const removeDependencies = (sourceDependencies, removeDependencies) =>
  Object.keys(sourceDependencies).reduce((result, dependency) => {
    if (!removeDependencies.includes(dependency)) {
      result[dependency] = sourceDependencies[dependency];
    }

    return result;
  }, {});

fs.writeJSONSync(
  remixDocsGenJsonPath,
  {
    ...remixDocsGenJson,
    devDependencies: removeDependencies(remixDocsGenJson.devDependencies, [
      configJson.name,
      "@remix-run/dev",
    ]),
  },
  { spaces: 2 }
);

execSync("yarn changeset publish");

fs.writeJSONSync(remixDocsGenJsonPath, remixDocsGenJson, { spaces: 2 });

execSync(`rimraf packages/${remixDocsGenName}/README.MD`);
