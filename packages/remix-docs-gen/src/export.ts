import chalk from "chalk";
import fs from "fs-extra";
import * as path from "path";
import { ComputedRoute, Route, RouteDocsAggregate } from "./types";
import { logSuccess } from "./utils";

const generateDocsForRoutes = (routes: ComputedRoute[]) => {
  return routes.map((item) => `"${item.path}": ${item.docs},`).join("\n    ");
};

export const exportDocs = (routes: ComputedRoute[], outputPath: string) => {
  const routeDocsAggregate = routes.reduce<RouteDocsAggregate>(
    (acc, route) => {
      const doesLoaderExist = route.docs?.includes("loader: { output: "); // this definitely isn't a perfect way of checking, but it's pretty unlikely to not be the case
      const doesActionExist = route.docs?.includes("action: { output: ");

      if (doesLoaderExist) {
        acc.loaders.push(route);
      }
      if (doesActionExist) {
        acc.actions.push(route);
      }

      acc.all.push(route);

      return {
        loaders: acc.loaders,
        actions: acc.actions,
        all: acc.all,
      };
    },
    { loaders: [], actions: [], all: [] }
  );

  const output = `// This file was automatically generated. Do not modify it.    
  export interface RemixLoaders {
    ${generateDocsForRoutes(routeDocsAggregate.loaders)}
  }

  export interface RemixActions {
    ${generateDocsForRoutes(routeDocsAggregate.actions)}
  }

  export type RemixDocs = {
    ${generateDocsForRoutes(routeDocsAggregate.all)}
  }
`;

  // export interface RemixDocs {
  //     ${routeDocs}
  // }

  fs.outputFileSync(path.resolve(process.cwd(), outputPath), output);

  logSuccess(
    `Exported documentation for ${routes.length} routes to "${chalk.underline(
      outputPath
    )}".`
  );
};
