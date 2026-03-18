
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      
      tenantId: "common",
    }),
  ],
  pages: {
    signOut: '/custom-signout-page',  
  },
  secret: process.env.NEXTAUTH_SECRET,
  authorization: {
    params: {
      scope: 'openid profile email offline_access Calendars.ReadWrite',
      prompt: 'consent', 
    },
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name || "Unknown",
              email: user.email,
              role: 'USER',
            },
          });
        } else {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name || existingUser.name,
              role: existingUser.role,
            },
          });
        }

        return true;
      } catch (error) {
        console.error('Error signing in user:', error);
        return false;
      }
    },

    async session({ session, token }) {

      if (token?.accessToken) {
        session.accessToken = token.accessToken; 
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { courseRoles: true },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.courseRoles = dbUser.courseRoles;
      }

      return session;
    },

    async jwt({ token, user, account }) {
      
      if (account) {
        token.accessToken = account.access_token; 
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    }
  },
};
