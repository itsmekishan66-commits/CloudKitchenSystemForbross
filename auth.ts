import NextAuth from "next-auth";
import type { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { scryptSync, timingSafeEqual } from "crypto";
import { getUserByEmail } from "@/db/services";
import { getUserRole } from "@/lib/getUserRole";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const dbUser = await getUserByEmail(email);

        if (!dbUser || !dbUser.passwordHash) return null;

        const verified = verifyPassword(String(credentials.password).trim(), dbUser.passwordHash);
        if (!verified) return null;

        return {
          id: String(dbUser.id),
          name: dbUser.name,
          email: dbUser.email,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
      }
      if (token.id) {
        const role = await getUserRole(Number(token.id));
        token.role = role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as number,
          role: token.role as string,
        } as typeof session.user;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

function verifyPassword(password: string, passwordHash: string) {
  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
