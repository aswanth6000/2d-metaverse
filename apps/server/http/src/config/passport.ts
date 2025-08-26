import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthProvider, prisma } from '@repo/db';



export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Google account email is required'), false);

      let user = await prisma.user.findUnique({where: {email}})

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            emailVerified: true,
            provider: AuthProvider.GOOGLE,
          },
        });
      } else if (user.provider !== AuthProvider.GOOGLE) {
        return done(new Error(`Email is already registered with ${user.provider}.`), false);
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error, false);
    }
  }
);