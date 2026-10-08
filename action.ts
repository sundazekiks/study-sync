"use server"

import { signIn, signOut, auth } from "@/auth"
import { AuthError } from "next-auth";
import { redirect } from 'next/navigation'
import { connectDB, Course as CourseModel, newId, Resource as ResourceModel, toCourse, User as UserModel } from '@/lib/mongo';
import { createFirstUser } from '@/lib/auth';


export type SignInState = { error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export const UserSignUp = async (
    prevState: SignInState,
    formData: FormData
): Promise<SignInState> => {
    const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
    const displayName = (formData.get("displayName") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    if (!email || !EMAIL_RE.test(email)) {
        return { error: "Enter a valid email address." };
    }
    if (!displayName) {
        return { error: "Display name is required." };
    }
    if (password.length < 8) {
        return { error: "Password must be at least 8 characters." };
    }

    await connectDB();
    const existing = await UserModel.exists({ email });
    if (existing) {
        return { error: "An account with this email already exists. Try signing in instead." };
    }

    try {
        await createFirstUser(email, displayName, password);
    } catch {
        return { error: "Could not create your account. Please try again." };
    }

    try {
        await signIn('credentials', { email, password, redirectTo: "/courses" });
    } catch (err) {
        if (err instanceof AuthError) {
            return { error: "Account created. Please sign in." };
        }
        throw err; // Next.js internals like NEXT_REDIRECT
    }
};


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

export const getUserCourses = async () => {
    const user = await auth();
    if (!user?.user) {
        redirect("/login");
    }

    await connectDB();
    const userId = await UserModel.findOne({ email: user.user.email })
    const courses = await CourseModel.find({ "members.userId": userId?._id }).lean();
    const resourceCounts = await ResourceModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]);
    const countByCourse = new Map(resourceCounts.map((r) => [r._id, r.count]));

    const myCourses = courses
        .map((c) => {
            const course = toCourse(c);
            const membership = course.members.find((m) => m.userId === user?.user?.id)!;
            return {
                id: course.id,
                name: course.name,
                description: course.description,
                color: course.color,
                role: membership.role,
                resourceCount: countByCourse.get(course.id) ?? 0,
                createdAt: course.createdAt,
            };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return { courses: myCourses };
}


export async function GithubSignIn() {
    await signIn("github", { redirectTo: "/courses" });
}