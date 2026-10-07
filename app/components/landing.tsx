import Link from "next/link";

const FEATURES = [
  {
    title: "Course organization",
    description:
      "Every course or study group gets its own hub with members, tasks, and materials grouped together, so you always know where you belong.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    title: "Task management",
    description:
      "Create shared tasks, assign them to group members, and track not-started, in-progress, and completed work with a live progress summary.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />
      </svg>
    ),
  },
  {
    title: "Resource sharing",
    description:
      "Keep links, notes, and uploaded files beside the course they belong to, so the whole group finds current study materials in one place.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 3v12" />
        <path d="m8 7 4-4 4 4" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    step: "1",
    title: "Create your account",
    description: "Sign up with your email, display name, and a password that meets the rules.",
  },
  {
    step: "2",
    title: "Create or join a course",
    description: "Start a course hub for a class or join the one your study group already uses.",
  },
  {
    step: "3",
    title: "Plan and track together",
    description: "Add tasks, share resources, and watch the group's progress in one workspace.",
  },
];

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            StudySync
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-28">
          <p className="mx-auto mb-4 inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            The collaborative study planner for university students
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Your whole study group, synced in one place.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            StudySync brings course organization, shared tasks, and study resources into a single
            workspace, so your group spends less time coordinating and more time studying.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={`${primaryButton} w-full sm:w-auto`}>
              Get started
            </Link>
            <Link href="/login" className={`${secondaryButton} w-full sm:w-auto`}>
              Log in
            </Link>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Studying together should not mean juggling five apps.
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Study groups usually run on disconnected calendars, chat threads, file folders, and
                personal task lists. Plans get lost in messages, files go stale, and nobody is quite
                sure what is left to do before the exam.
              </p>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                StudySync replaces that scatter with one linked workflow: courses and groups,
                scheduling, resources, and task progress all live together, so everyone sees the
                same plan.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {[
                "Links, notes, and files buried in chat threads",
                "No shared view of who is doing what",
                "Schedules that live in three different calendars",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <span aria-hidden="true" className="mt-0.5 text-red-500">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            One hub for the way you actually study
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
            Three things every study group needs, kept side by side instead of spread across tools.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {feature.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              How to get started
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-indigo-600">
          <div className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Ready to sync up your study group?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">
              Create your free account and set up your first course hub in a few minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-2.5 font-medium text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-indigo-300 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <p>StudySync — a collaborative study planner for university students.</p>
          <p>Organize courses, manage tasks, share resources.</p>
        </div>
      </footer>
    </div>
  );
}
