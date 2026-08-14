import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { profile: { firstName: { contains: q, mode: "insensitive" } } },
            { profile: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {},
    include: { profile: true, roles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        {/* File download endpoint, not a page — must be a full navigation, not next/link */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/users/export" className={buttonVariants({ variant: "outline" })}>
          Export CSV
        </a>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <button className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Search</button>
      </form>

      <div className="space-y-2">
        {users.map((u) => {
          const name = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.name || "Unnamed";
          return (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                  {name}
                </Link>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={u.status === "ACTIVE" ? "secondary" : "outline"}>{u.status.replace("_", " ")}</Badge>
                  {u.roles.map((r) => (
                    <Badge key={r.roleId} variant="outline">{r.role.key}</Badge>
                  ))}
                </div>
              </div>
              <UserRowActions userId={u.id} status={u.status} />
            </div>
          );
        })}
        {users.length === 0 && <p className="text-muted-foreground">No users match that search.</p>}
      </div>
    </div>
  );
}
