export interface Route {
  path: string;
  file: string;
}

export interface ComputedRoute extends Route {
  docs?: string | null;
}

export interface RemixRoute {
  path?: string;
  file?: string;
  index?: true;
  children?: RemixRoute[];
}
