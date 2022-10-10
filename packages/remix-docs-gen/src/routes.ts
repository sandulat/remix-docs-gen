import { cli } from "@remix-run/dev";
import * as path from "path";
import { config } from "./config";
import type { RemixRoute, Route } from "./types";

const processRemixRoutes = (
  routes: RemixRoute[],
  parentPath?: RemixRoute["path"]
): Route[] =>
  routes
    .map((item) => {
      const routePath = `${parentPath ?? ""}${item.path ?? ""}`;

      return [
        {
          path: (routePath.endsWith("/") && routePath !== "/"
            ? routePath.slice(0, -1)
            : routePath
          ).replace(/\/\/+/g, "/"),
          file: path.resolve(
            process.cwd(),
            `${config.appDirectory}/${item.file!}`
          ),
        },
        ...(item.children
          ? processRemixRoutes(item.children, `${routePath}/`)
          : []),
      ];
    })
    .flat()
    .filter(
      (route, index, routes) =>
        routes.findIndex(
          (comparedRoute) => comparedRoute.path === route.path
        ) === index
    )
    .filter((item) => Boolean(item.path) && !item.path.includes("/*"));

export const parseRoutes = async (regexFilter?: string) => {
  // TODO: Get rid of this approach when Remix exposes routes publicly.
  const originalConsoleLog = console.log;

  let parsedRoutes = await new Promise<Route[]>(async (resolve) => {
    console.log = (stdout) => {
      try {
        const parsedRoutes = JSON.parse(stdout);

        if (
          Array.isArray(parsedRoutes) &&
          typeof parsedRoutes[0] === "object" &&
          parsedRoutes[0].id === "root"
        ) {
          resolve(processRemixRoutes(JSON.parse(stdout)));
        } else {
          resolve([]);
        }
      } catch (e) {
        resolve([]);
      }
    };

    await cli.run(["routes", "--json"]);
  });

  console.log = originalConsoleLog;

  if (parsedRoutes.length === 0) {
    throw new Error(
      'Couldn\'t parse routes. This may be due to breaking changes in "@remix-run/dev".'
    );
  }

  if (regexFilter) {
    parsedRoutes = parsedRoutes.filter((route) =>
      new RegExp(regexFilter).test(route.path)
    );
  }

  return parsedRoutes;
};
