import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import * as z from 'zod'
import { connectDB, toUser } from "./lib/mongo";
import { User as UserModel } from "./lib/mongo";


// Providers Imports
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "./lib/auth";


// Zod Schema for Validation
const SignInSchema = z.object({
    email: z.email(),
    password: z.string()
})

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    callbacks: {

    },
    providers: [
        Credentials(
            {
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" }
                },
                authorize: async (credentials) => {
                    const { email, password } = credentials;

                    try {
                        // Validate data
                        const isValidData = SignInSchema.safeParse({ email, password })
                        if (!isValidData.success) throw new Error();
                        // connect to db
                        await connectDB();
                        // Find user by email
                        const existingUser = await UserModel.findOne({ email: isValidData.data.email }).lean();
                        const user = existingUser ? toUser(existingUser) : null;

                        if (!user || !verifyPassword(password as string, user.passwordHash)) {
                            return null
                        }

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.displayName
                        }
                    } catch (err) {
                        if (err instanceof z.ZodError) console.log(err.issues)
                        return null;
                    }

                }
            }
        )
    ]
})