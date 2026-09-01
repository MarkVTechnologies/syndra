import { z } from "zod";

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInputType = z.infer<typeof LoginInput>;

export const RequestResetInput = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const ResetPasswordInput = z.object({
  token: z.string().min(1),
  password: z.string().min(10),
});

export const VerifyEmailInput = z.object({
  token: z.string().min(1),
});

export const Role = z.enum(["admin", "ambassador", "syndicator"]);
export type RoleType = z.infer<typeof Role>;

export const UserStatus = z.enum([
  "pending_verification",
  "pending_approval",
  "active",
  "suspended",
]);
export type UserStatusType = z.infer<typeof UserStatus>;
