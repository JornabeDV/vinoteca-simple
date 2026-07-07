import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { BusinessStatus } from "@prisma/client";

// Constant-time dummy hash used to prevent timing attacks that enumerate
// registered emails by measuring login response times.
const DUMMY_PASSWORD_HASH =
  "$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { business: true },
        });

        // Always run bcrypt.compare to keep response time constant and avoid
        // email enumeration through timing analysis.
        const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          passwordHash
        );

        if (!user || !user.password || !isPasswordValid) {
          return null;
        }

        // Reject logins for users whose business has been suspended.
        if (
          user.businessId &&
          user.business?.status === BusinessStatus.SUSPENDED
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          businessId: user.businessId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.businessId = user.businessId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string | null | undefined;
      }
      return session;
    },
  },
};
