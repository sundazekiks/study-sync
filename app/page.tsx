import Dashboard from "@/app/components/dashboard";
import Landing from "@/app/components/landing";
import MyTasks from "@/app/components/my-tasks";
import SignOutButton from "@/app/components/sign-out-button";
import { getSessionUser } from "@/lib/auth";
import { listCourseViews } from "@/lib/courses";
import { getDashboardStats } from "@/lib/dashboard";

export default async function Home() {
  const user = await getSessionUser();

  if (!user) {
    return <Landing />;
  }

  const [courses, stats] = await Promise.all([
    listCourseViews(user.id),
    getDashboardStats(user.id),
  ]);

  return (
    <Dashboard
      user={{ id: user.id, email: user.email, displayName: user.displayName }}
      courses={courses}
      stats={stats}
      headerAction={<SignOutButton />}
      myTasks={<MyTasks userId={user.id} />}
    />
  );
}
