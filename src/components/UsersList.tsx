import { useState, useEffect } from "react";
import { Shield, UserCircle, Check, X, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUserListItemDTO, UserRole } from "@/types";

interface UsersListProps {
  initialUsers: AdminUserListItemDTO[];
}

export const UsersList = ({ initialUsers }: UsersListProps) => {
  const [users, setUsers] = useState(initialUsers);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleTogglePhotoPermission = async (userId: string, currentValue: boolean) => {
    setUpdatingUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          can_add_photos: !currentValue,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permission");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, can_add_photos: !currentValue } : user))
      );

      toast.success(`Photo permission ${!currentValue ? "granted" : "revoked"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission");
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      // Update local state
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div>
      <Toaster />

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-800/50">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[150px]">Role</TableHead>
              <TableHead className="w-[180px]">Photo Permissions</TableHead>
              <TableHead className="w-[120px]">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => {
                const isUpdating = updatingUsers.has(user.id);

                return (
                  <TableRow key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                          {user.role === "admin" ? (
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <UserCircle className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {user.nickname || "No nickname"}
                          </div>
                          {user.consent_given_at && (
                            <div className="text-xs text-neutral-500">Consent given</div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {user.email || "No email"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.can_add_photos}
                          onCheckedChange={() => handleTogglePhotoPermission(user.id, user.can_add_photos)}
                          disabled={isUpdating}
                        />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {user.can_add_photos ? "Can add photos" : "Cannot add photos"}
                        </span>
                        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-neutral-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
