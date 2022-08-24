import chalk from "chalk";
import fs from "fs-extra";
import * as path from "path";
import { ComputedRoute } from "./types";
import { logSuccess } from "./utils";

export const exportDocs = (routes: ComputedRoute[], outputPath: string) => {
  const routeDocs = routes
    .map((item) => `"${item.path}": ${item.docs},`)
    .join("\n    ");

  const output = `// This file was automatically generated. Do not modify it.    
export interface RemixDocs {
    ${routeDocs}
}
`;

  fs.outputFileSync(path.resolve(process.cwd(), outputPath), output);

  logSuccess(
    `Exported documentation for ${routes.length} routes to "${chalk.underline(
      outputPath
    )}".`
  );
};
