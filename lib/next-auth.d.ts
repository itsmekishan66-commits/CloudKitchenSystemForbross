import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: string;
  }
}
