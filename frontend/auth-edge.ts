import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/** Middleware-only auth() — JWT decode alone, no DB/native deps. */
export const { auth } = NextAuth(authConfig);
