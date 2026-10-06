import { getUserCourses } from "@/action";
import { auth } from "@/auth";
import CoursePage from "@/components/Courses/CoursePage";
import { redirect } from "next/navigation";

export default async function Courses() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login')
    }
    const courses = await getUserCourses();

    console.log(session.user)
    return (<CoursePage User={{
        id: session.user.id as string,
        email: session.user.email as string,
        displayName: session.user.name as string
    }}
        Courses={courses.courses} />)
}