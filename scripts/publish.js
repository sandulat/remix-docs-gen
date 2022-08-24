const { execSync } = require("child_process");
const fs = require("fs-extra");

const remixDocsGenName = "remix-docs-gen";

execSync("yarn build");

execSync(`cp README.md packages/${remixDocsGenName}`);

const remixDocsGenJsonPath = `packages/${remixDocsGenName}/package.json`;

const remixDocsGenJson = fs.readJSONSync(remixDocsGenJsonPath);

const configJson = fs.readJSONSync("packages/config/package.json");

const localDevDependencies = [configJson.name];

const filterLocalDevDependencies = (devDependencies) =>
  Object.keys(devDependencies).reduce((result, dependency) => {
    if (!localDevDependencies.includes(dependency)) {
      result[dependency] = devDependencies[dependency];
    }

    return result;
  }, {});

fs.writeJSONSync(
  remixDocsGenJsonPath,
  {
    ...remixDocsGenJson,
    devDependencies: filterLocalDevDependencies(
      remixDocsGenJson.devDependencies
    ),
  },
  { spaces: 2 }
);

execSync("yarn changeset publish");

fs.writeJSONSync(remixDocsGenJsonPath, remixDocsGenJson, { spaces: 2 });

execSync(`rimraf packages/${remixDocsGenName}/README.MD`);
