import mongoose from "mongoose";

const DEFAULT_DB = "anon_complaint_db";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function getConnection(): Promise<typeof mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI não definida");

    const maxPoolSize = Number(process.env.MONGODB_MAX_POOL_SIZE ?? "50");
    cached!.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB ?? DEFAULT_DB,
      bufferCommands: false,
      maxPoolSize: Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? Math.min(200, maxPoolSize) : 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production",
    }).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}