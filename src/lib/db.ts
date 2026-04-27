import mongoose from "mongoose";

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

const DEFAULT_DB = "anon_complaint";

/** Constrói a URI garantindo que o nome da base de dados está presente (para MongoDB Atlas). */
function getMongoUri(): string {
  const raw = process.env.MONGODB_URI ?? `mongodb://localhost:27017/${DEFAULT_DB}`;
  const dbName = process.env.MONGODB_DB ?? DEFAULT_DB;

  if (raw.includes(".mongodb.net/") && !raw.match(/\.mongodb\.net\/[^/?]/)) {
    return raw.replace(".mongodb.net/", `.mongodb.net/${dbName}`);
  }
  if (raw.includes("localhost") && !raw.includes("localhost:27017/")) {
    return raw.replace(/(localhost:\d+)\/?/, `$1/${dbName}`);
  }
  return raw;
}

export function getConnection(): Promise<typeof mongoose> {
  if (global._mongooseConnection) return global._mongooseConnection;
  const uri = getMongoUri();
  global._mongooseConnection = mongoose.connect(uri);
  return global._mongooseConnection;
}
