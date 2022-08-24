import { execSync } from "child_process";
import chokidar from "chokidar";
import meow from "meow";
import * as path from "path";
import { config } from "./config";
import { generateDocs } from "./docs";
import { exportDocs } from "./export";
import { parseRoutes } from "./routes";
import { logError, logInfo } from "./utils";

const helpText = `
Usage
  $ remix-docs-gen -o my-docs.ts

Options
  --help                 Print this help message and exit
  --version, -v          Print the CLI version and exit
  --output, -o           The path for docs export
  --regex, -r            The regex to filter routes
  --watch, -w            Watch for changes
  --post-export          Execute a command after docs export
`;

const cli = meow(helpText, {
  autoHelp: true,
  autoVersion: false,
  flags: {
    version: {
      type: "boolean",
      alias: "v",
    },
    output: {
      type: "string",
      alias: "o",
    },
    regex: {
      type: "string",
      alias: "r",
    },
    watch: {
      type: "boolean",
      alias: "w",
    },
    postExport: {
      type: "string",
    },
  },
});

if (cli.flags.version) {
  cli.showVersion();
}

if (!cli.flags.output) {
  logError("Please specify the output path.");

  process.exit(1);
}

const processDocs = async () => {
  const routes = await parseRoutes(cli.flags.regex);

  const computedRoutes = generateDocs(routes);

  exportDocs(computedRoutes, cli.flags.output!);

  if (typeof cli.flags.postExport !== "undefined") {
    execSync(cli.flags.postExport, { stdio: "inherit" });
  }
};

const bootstrap = async () => {
  await processDocs();

  if (cli.flags.watch) {
    logInfo("Watching for file changes.");

    chokidar
      .watch(
        [`${config.appDirectory}/**/*.{ts,tsx,js,jsx}`].map((item) =>
          path.resolve(process.cwd(), item)
        ),
        {
          ignoreInitial: true,
        }
      )
      .on("all", async () => await processDocs());
  }
};

bootstrap();
