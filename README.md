<p align="center">
    <a href="https://github.com/sandulat/remix-docs-gen" target="_blank">
        <img src="https://raw.githubusercontent.com/sandulat/remix-docs-gen/main/assets/remix-docs-gen.png" width="250px" />
    </a>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/remix-docs-gen"><img src="https://img.shields.io/npm/v/remix-docs-gen?color=%23AD1CB0&label=remix-docs-gen" alt="remix-docs-gen"></a>
<a href="https://github.com/sandulat/remix-docs-gen/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/sandulat/remix-docs-gen?color=%23AD1CB0" alt="License"></a>
<a href="https://twitter.com/sandulat"><img src="https://img.shields.io/twitter/follow/sandulat?label=Twitter" alt="Twitter"></a>
</p>

## About

`remix-docs-gen` parses all of your `Remix` loaders and actions and _automatically_ documents all the typings per each route.

## Installation

First, you have to install the package itself:

```
yarn add -D remix-docs-gen
```

## Usage Example

You can simply run:

```
yarn remix-docs-gen -o api-docs.ts
```

It will magically parse all of your routes and extract all the return types of your loaders and actions.

## CLI Options

| Option        | Alias | Description                         |
| ------------- | ----- | ----------------------------------- |
| --help        |       | Print the help message and exit     |
| --version     | -v    | Print the CLI version and exit      |
| --output      | -o    | The path for docs export            |
| --regex       | -r    | The regex to filter routes          |
| --watch       | -w    | Watch for changes                   |
| --post-export |       | Execute a command after docs export |

## Loader output documentation

For example having a route in `app/routes/articles` with the following content:

```ts
export const loader = () => {
  return {
    articles: db.articles.findMany(),
  };
};
```

The package will fully infer the return type of the loader and produce the following example output:

```ts
export interface RemixDocs {
  "/articles": {
    loader: { output: { articles: { id: string; title: string }[] } };
  };
}
```

## Action output documentation

For example having a route in `app/routes/articles` with the following content:

```ts
export const action = () => {
  return {
    myNewArticle: db.articles.create(),
  };
};
```

The package will fully infer the return type of the action and produce the following example output:

```ts
export interface RemixDocs {
  "/articles": {
    action: { output: { myNewArticle: { id: string; title: string } } };
  };
}
```

## Output typings customization

If you'd like to manually define the typings of the loader's or action's output, in your route simply export your custom `LoaderOutput` or `ActionOutput` types as needed:

```ts
export type LoaderOutput = {
  articles: { custom: string }[];
};

export type ActionOutput = {
  myNewArticle: { custom: string };
};
```

Which will produce the following result:

```ts
export interface RemixDocs {
  "/articles": {
    loader: { output: { articles: { custom: string }[] } };
    action: { output: { myNewArticle: { custom: string } } };
  };
}
```

## Documenting input typings

Besides returing data, `loaders` and `actions` usually also expect data to be coming in from the client. To document that, in your route simply export the `LoaderInput` or `ActionInput` types as needed:

```ts
export type ActionInput = {
  articleData: { title: string };
};
```

Which will produce the following result:

```ts
export interface RemixDocs {
  "/articles": {
    action: { input: { articleData: { title: string } } };
  };
}
```

This can be very convenient when working with tools like `Zod`, for example:

```ts
const articleSchema = z.object({
  title: z.string().min(1),
});

export type ActionInput = z.infer<typeof articleSchema>;
```

## Route documentation override

If you'd like to fully override the generated documentation typings of a specific route, simply export a `Docs` type:

```ts
export type Docs = {
  my: {
    custom: {
      documentation: string;
    };
  };
};
```

Which will produce the following output:

```ts
export interface RemixDocs {
  "/articles": { my: { custom: { documentation: string } } };
}
```

## Generating typings for specific routes only

You can leverage the `--regex` or `--r` flag to only generate typings for the desired routes. For example, that's how you'd document only the routes starting with `/api`.

```
yarn remix-docs-gen --output api-docs.ts --regex /api
```

## Dynamic segments

For routes with dynamic segments, the following pattern is being output:

```ts
export interface RemixDocs {
  "/reset-password/:token": {
    // ...
  };
}
```

## Generating typings for other languages

For generating typings for other languages besides Typescript, you can use tools like [quicktype](https://github.com/quicktype/quicktype) on top of the generated Typescript file.
