import type { ContentServer, ContentTarget } from "./content-manifest";

export type ContentTargetCliOptions = ContentTarget;

export const readArg = (args: string[], name: string): string | null => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }
  return args[index + 1];
};

export const getDefaultContentHost = (server: ContentServer): string =>
  server === "local"
    ? "ws://127.0.0.1:3000"
    : "https://maincloud.spacetimedb.com";

export const parseContentServer = (
  value: string,
  fieldName: string,
): ContentServer => {
  if (value !== "local" && value !== "maincloud") {
    throw new Error(`${fieldName} must be either local or maincloud`);
  }
  return value;
};

export const resolveContentDatabase = (): string =>
  process.env.SPACETIMEDB_DB_NAME ??
  process.env.VITE_SPACETIMEDB_DB_NAME ??
  "grezwandererdata";

export const parseContentTargetArgs = (
  args: string[],
  usage: () => void,
): ContentTargetCliOptions => {
  const serverRaw = readArg(args, "--server") ?? "local";
  let server: ContentServer;
  try {
    server = parseContentServer(serverRaw, "--server");
  } catch (error) {
    usage();
    throw error;
  }

  const database = readArg(args, "--db") ?? resolveContentDatabase();
  const host = readArg(args, "--host") ?? getDefaultContentHost(server);
  return { server, host, database };
};

export const formatContentTarget = (
  target: Pick<ContentTargetCliOptions, "server" | "host" | "database">,
): string => `${target.server} (${target.host}) db=${target.database}`;
