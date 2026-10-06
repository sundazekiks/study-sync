"use server"

import { signIn, signOut, auth } from "@/auth"
import { AuthError } from "next-auth";
import { redirect } from 'next/navigation'
import { connectDB, Course as CourseModel, newId, Resource as ResourceModel, toCourse } from "@/lib/mongo";


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

export const getUserCourses = async () => {
    const user = await auth();
    if (!user?.user) {
        redirect("/login");
    }

    await connectDB();
    const courses = await CourseModel.find({ "members.userId": user?.user.id }).lean();
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