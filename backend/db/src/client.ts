import mongoose from "mongoose";
import { getEnv } from "@san/core/env";

/**
 * Connection reuse across serverless invocations. A global cache survives
 * hot module reloads in dev and warm Lambda/Vercel Function instances in
 * production, avoiding a new TCP/TLS handshake on every request.
 */
declare global {
  var __sanMongooseConn: Promise<typeof mongoose> | undefined;
}

// Mongoose readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
// A cached *promise* being resolved doesn't mean the connection it resolved
// to is still alive — the underlying socket can drop later (idle timeout,
// Atlas failover) while the resolved promise object sticks around forever.
// Reusing it in that state makes every query buffer against a dead
// connection until it hits mongoose's buffering timeout.
const LIVE_STATES = new Set([1, 2]);

export async function connectDb(): Promise<typeof mongoose> {
  if (global.__sanMongooseConn && LIVE_STATES.has(mongoose.connection.readyState)) {
    return global.__sanMongooseConn;
  }

  const env = getEnv();
  mongoose.set("strictQuery", true);

  // If this connection attempt rejects (a transient blip, or — as happened
  // in dev — the very first request racing an Atlas IP allow-list update),
  // clear the cache so the NEXT call gets a fresh connect() instead of
  // replaying the same dead rejected promise forever. Without this, one
  // failed first attempt permanently wedges a warm serverless instance.
  const connectPromise = mongoose
    .connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
    .catch((e: unknown) => {
      if (global.__sanMongooseConn === connectPromise) global.__sanMongooseConn = undefined;
      throw e;
    });

  global.__sanMongooseConn = connectPromise;
  return connectPromise;
}

export { mongoose };
