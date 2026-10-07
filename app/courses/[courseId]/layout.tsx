import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getCourseById, isMember } from "@/lib/permissions";

export async function generateMetadata({ params }: LayoutProps<"/courses/[courseId]">): Promise<Metadata> {
  const { courseId } = await params;
  const [user, course] = await Promise.all([getSessionUser(), getCourseById(courseId)]);

  if (!course || !user || !isMember(course, user.id)) {
    return { title: "Course", robots: { index: false, follow: false } };
  }

  const description = course.description || `${course.name} study materials on StudySync.`;
  const url = `/courses/${course.id}`;

  return {
    title: course.name,
    description,
    openGraph: { title: course.name, description, url },
    twitter: { card: "summary_large_image", title: course.name, description },
    robots: { index: false, follow: false },
  };
}

export default function CourseLayout({ children }: LayoutProps<"/courses/[courseId]">) {
  return children;
}