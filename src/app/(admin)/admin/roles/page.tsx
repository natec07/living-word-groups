import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/rbac";

export default async function AdminRolesPage() {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, users: true },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roles &amp; Permissions</h1>
        <p className="mt-1 text-muted-foreground">
          Default permissions per role. Assign roles to individual members from their user page — admins can also grant or revoke
          individual permissions per user beyond these defaults.
        </p>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{ROLE_LABELS[role.key]}</p>
              <span className="text-sm text-muted-foreground">{role.users.length} members</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {role.permissions.length === 0 && <span className="text-sm text-muted-foreground">No platform-wide permissions — scoped to assigned groups/ministries.</span>}
              {role.permissions.map((p) => (
                <span key={p.permissionId} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {p.permission.key}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
