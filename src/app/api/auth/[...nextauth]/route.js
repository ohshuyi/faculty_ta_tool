import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create a new user with a default role of 'USER'
          await prisma.user.create({
            data: {
              name: user.name || "Unknown",
              email: user.email,
              role: 'USER', // Default role can be changed here
            },
          });
        } else {
          // Update the user’s role if needed or any other information
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name || existingUser.name,
              role: existingUser.role, // Keep the existing role, or update it based on your logic
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
      // Fetch user and attach the role to the session
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role; // Attach the user's role to the session
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Include role in the JWT
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
