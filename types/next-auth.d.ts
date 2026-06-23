import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: string;
    } & Omit<DefaultSession["user"], "id">;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: string;
  }
}
