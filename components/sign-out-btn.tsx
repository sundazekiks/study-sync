import { UserSignOut } from '@/action';


export default function SignOutBtn() {
    return (
        <form action={UserSignOut}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <input type='submit' value='Sign Out' />
        </form>
    )
}
