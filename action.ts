"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth";
import { redirect } from 'next/navigation'


export type SignInState = { error?: string } | undefined;


export const UserSignIn = async (
    prevState: SignInState,
    formData: FormData
): Promise<SignInState> => {
    const email = formData.get("email");
    const password = formData.get("password");

    try {
        await signIn('credentials', {
            email, password
        })
    } catch (err) {
        if (err instanceof AuthError) {
            switch (err.type) {
                case "CredentialsSignin":
                    return { error: "Invalid email or password." };
                default:
                    return { error: "Something went wrong. Please try again." };
            }
        }
        throw err; // unexpected errors, and Next.js internals like NEXT_REDIRECT
    }
    redirect("/courses");
}

export const UserSignOut = async () => {
    await signOut();
}