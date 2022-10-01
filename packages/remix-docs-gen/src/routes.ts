import { exec } from "child_process";
import * as path from "path";
import { config } from "./config";
import { RemixRoute, Route } from "./types";

export const parseRoutes = (regexFilter?: string) =>
  new Promise<Route[]>((resolve) => {
    exec("remix routes --json | tee", async (error, output) => {
      if (error) {
        throw error;
      }

      const parseRoutes = (
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
                ? parseRoutes(item.children, `${routePath}/`)
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

      let foundRoutes = parseRoutes(JSON.parse(output));
      let homeRoute = foundRoutes.find((route) => route.path === "/");
      if (!homeRoute) {
        throw new Error("Home Route not found");
      }
      let rootRouteFile = (() => {
        let filePathArray = homeRoute.file.split("/");
        filePathArray.pop();
        filePathArray.pop();
        return filePathArray.join("/") + "/root.tsx";
      })();

      let rootRoute = {
        path: "/root",
        file: rootRouteFile,
      };

      let routes = [...foundRoutes, rootRoute];

      if (regexFilter) {
        routes = routes.filter((route) =>
          new RegExp(regexFilter).test(route.path)
        );
      }

      resolve(routes);
    });
  });
