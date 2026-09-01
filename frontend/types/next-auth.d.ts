import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "ambassador" | "syndicator";
      sessionVersion: number;
      sid: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "ambassador" | "syndicator";
    sessionVersion: number;
    sid: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "ambassador" | "syndicator";
    sessionVersion?: number;
    sid?: string;
  }
}
