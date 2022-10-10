import * as path from "path";
import { Project, SourceFile } from "ts-morph";
import { ComputedRoute, Route } from "./types";

const parseType = (sourceFile: SourceFile, typeName: string) => {
  try {
    const timestamp = new Date().getTime();

    const reservedTagTypeName = `__RESERVED_TAG_${timestamp}`;

    const reservedTaggedTypeName = `__RESERVED_TAGGED_${timestamp}`;

    const reservedUnpackStringTypeName = `__RESERVED_UNPACK_STRING_${timestamp}`;

    const reservedUnpackStringEndTypeName = `__RESERVED_UNPACK_STRING_END_${timestamp}`;

    const reservedUnpackNumberTypeName = `__RESERVED_UNPACK_NUMBER_${timestamp}`;

    const reservedUnpackNumberEndTypeName = `__RESERVED_UNPACK_NUMBER_END_${timestamp}`;

    const reservedExpandRecursivelyTypeName = `__RESERVED_EXPAND_RECURSIVELY_${timestamp}`;

    sourceFile.getTypeAliasOrThrow(typeName).replaceWithText(`
declare const ${reservedTagTypeName}: unique symbol;

declare type ${reservedTaggedTypeName}<Token> = {
  readonly [${reservedTagTypeName}]: Token;
};

type ${reservedUnpackStringTypeName}<Type, Token = unknown> = Type &
  ${reservedTaggedTypeName}<Token>;

type ${reservedUnpackNumberTypeName}<Type, Token = unknown> = Type &
  ${reservedTaggedTypeName}<Token>;

type ${reservedExpandRecursivelyTypeName}<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ${reservedExpandRecursivelyTypeName}<O[K]> }
    : never
  : T extends string
  ? ${reservedUnpackStringTypeName}<\`\${T}\`, "${reservedUnpackStringEndTypeName}">
  : T extends number | bigint
  ? ${reservedUnpackNumberTypeName}<\`\${T}\`, "${reservedUnpackNumberEndTypeName}">
  : T;

type ${typeName} = ${reservedExpandRecursivelyTypeName}<${sourceFile
      .getTypeAliasOrThrow(typeName)
      .getType()
      .getApparentType()
      .getText(sourceFile.getTypeAliasOrThrow(typeName))}>;`);

    return sourceFile
      .getTypeAliasOrThrow(typeName)
      .getType()
      .getApparentType()
      .getText(sourceFile.getTypeAliasOrThrow(typeName))
      .replace(new RegExp(`${reservedUnpackStringTypeName}<`, "g"), "")
      .replace(new RegExp(`, "${reservedUnpackStringEndTypeName}">`, "g"), "")
      .replace(new RegExp(`${reservedUnpackNumberTypeName}<"`, "g"), "")
      .replace(new RegExp(`", "${reservedUnpackNumberEndTypeName}">`, "g"), "")
      .replace(new RegExp(`${reservedUnpackNumberTypeName}<\`\\\${`, "g"), "")
      .replace(
        new RegExp(`}\`, "${reservedUnpackNumberEndTypeName}">`, "g"),
        ""
      )
      .replace(
        new RegExp(`{ readonly \\\[Symbol\\\.toStringTag]: string; }`, "g"),
        "never"
      );
  } catch {
    return null;
  }
};

const parseDataFunctionOutput = (
  sourceFile: SourceFile,
  dataFunctionName: "loader" | "action"
) => {
  const entity =
    sourceFile.getFunction(dataFunctionName) ||
    sourceFile.getVariableStatement(dataFunctionName);

  if (!entity || !entity.isExported()) {
    return null;
  }

  const timestamp = new Date().getTime();

  const typeName = `__RESERVED_${dataFunctionName}_RETURN_TYPE_${timestamp}`;

  const serializeFromTypeName = `__RESERVED_SERIALIZE_FROM_${timestamp}`;

  sourceFile
    .replaceWithText(
      `import type { SerializeFrom as ${serializeFromTypeName} } from "@remix-run/server-runtime";
${sourceFile.getFullText()}

type ${typeName} = ${serializeFromTypeName}<typeof ${dataFunctionName}>;
`
    )
    .getFullText();

  return parseType(sourceFile, typeName);
};

const processRouteDocs = (sourceFile?: SourceFile) => {
  if (!sourceFile) {
    return null;
  }

  const docsType = parseType(sourceFile, "Docs");

  if (docsType) {
    return docsType;
  }

  const loaderOutput = parseDataFunctionOutput(sourceFile, "loader");

  const actionOutput = parseDataFunctionOutput(sourceFile, "action");

  if (!loaderOutput && !actionOutput) {
    return null;
  }

  let result = "{";

  if (loaderOutput) {
    const loaderInput = parseType(sourceFile, "LoaderInput");

    result = `${result} loader: { ${
      loaderInput ? `input: ${loaderInput}, ` : ""
    }output: ${loaderOutput} },`;
  }

  if (actionOutput) {
    const actionInput = parseType(sourceFile, "ActionInput");

    result = `${result} action: { ${
      actionInput ? `input: ${actionInput}, ` : ""
    }output: ${actionOutput} }`;
  }

  return `${result} }`;
};

export const generateDocs = (routes: Route[]): ComputedRoute[] => {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  });

  return routes.reduce<ComputedRoute[]>((result, item) => {
    const sourceFile = project.getSourceFile(item.file);

    const routeDocs = processRouteDocs(sourceFile);

    if (routeDocs) {
      result.push({
        ...item,
        docs: routeDocs,
      });
    }

    return result;
  }, []);
};
