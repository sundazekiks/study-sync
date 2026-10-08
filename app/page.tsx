import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "StudySync — One hub for your study groups",
  description:
    "Plan study sessions, share resources, and track tasks with your group. All in one shared course hub. Free to get started.",
};

const features = [
  {
    title: "Course hubs",
    description:
      "Bring every class together in one shared space. Organize groups, invite classmates, and keep everything in sync.",
    icon: (
      <path d="M4 5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 14.5v-9zM7 8h6M7 11h4" />
    ),
  },
  {
    title: "Shared resources",
    description:
      "Collect links and files in one place. Add a title, description, and tags so nothing gets lost in the chat.",
    icon: (
      <path d="M7 3.5A2.5 2.5 0 004.5 6v8A2.5 2.5 0 007 16.5h6a2.5 2.5 0 002.5-2.5V8.62a2 2 0 00-.586-1.414l-2.62-2.62A2 2 0 0010.88 4H7a4 4 0 00-.5.06" />
    ),
  },
  {
    title: "Tasks & checkpoints",
    description:
      "Turn big assignments into small checkpoints. Track progress with due dates and clear, visual progress bars.",
    icon: (
      <path d="M4 6.5h9M4 10h9M4 13.5h5M15.5 12.5l1.5 1.5 2.5-2.5" />
    ),
  },
  {
    title: "Roles & collaboration",
    description:
      "Owners, moderators, and members each get the right access. Study together without stepping on each other.",
    icon: (
      <path d="M10 10.5a3 3 0 100-6 3 3 0 000 6zM4.5 16.5a5.5 5.5 0 0111 0M15 8.5a2.5 2.5 0 100-5" />
    ),
  },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds with your email or continue with GitHub. Free, no credit card required.",
  },
  {
    step: "02",
    title: "Start a course hub",
    description: "Create a course, add a short description, and invite your classmates to join the group.",
  },
  {
    step: "03",
    title: "Study in sync",
    description: "Upload resources, break down tasks, and watch your group move forward together.",
  },
];

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </span>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              StudySync
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-400">
            <a href="#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/courses"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent_70%)]"
          />
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div className="flex flex-col items-start">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                Built for student study groups
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
                One hub for your
                <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  {" "}
                  study groups
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Stop juggling chats, scattered links, and sticky notes. StudySync brings your courses,
                resources, and tasks together so your group can actually focus on learning.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-zinc-300 px-6 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
                No credit card required. Continue with email or GitHub.
              </p>
            </div>

            {/* Product mock */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/20 via-transparent to-sky-500/20 blur-2xl"
              />
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-sm font-semibold text-white">
                      B
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Biology 101 Study Group
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">4 members · 6 resources</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    owner
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    { label: "Chapter 4 lecture slides", tag: "slides" },
                    { label: "Lab safety checklist", tag: "file" },
                    { label: "Exam 1 study guide", tag: "link" },
                  ].map((resource) => (
                    <div
                      key={resource.label}
                      className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden
                        >
                          <path d="M11.5 3H6.5A1.5 1.5 0 005 4.5v11A1.5 1.5 0 006.5 17h7a1.5 1.5 0 001.5-1.5V6.5L11.5 3z" />
                          <path d="M11.5 3v3.5H15" />
                        </svg>
                      </span>
                      <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                        {resource.label}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {resource.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">Exam 1 prep</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">3/5 checkpoints</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full w-3/5 rounded-full bg-teal-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Everything your group needs, in one place
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                StudySync replaces the pile of apps your group uses to stay organized.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      {feature.icon}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                From empty account to a working study hub in a couple of minutes.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="relative">
                  <span className="text-sm font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-14 text-center shadow-lg sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get your study group in sync?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
              Create your free account and set up your first course hub in minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              S
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">StudySync</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            One course hub for collaborative study materials.
          </p>
          <div className="flex items-center gap-5 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/login" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Sign in
            </Link>
            <Link href="/signup" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}