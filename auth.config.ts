import { NextAuthConfig } from "next-auth";


export const authConfig = {
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/courses");

            if (isOnDashboard) {
                return isLoggedIn; // false -> redirected to /login
            }

            // Logged-in users shouldn't see the login/signup pages
            if (
                isLoggedIn &&
                (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")
            ) {
                return Response.redirect(new URL("/courses", nextUrl));
            }

            return true; // public routes
        },
    },
    providers: [], // in the auth.ts file going to provide the providers for the authentication

} satisfies NextAuthConfig;