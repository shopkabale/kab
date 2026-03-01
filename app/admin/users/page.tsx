"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { User } from "@/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!user || user.role !== "admin") return;
      try {
        const res = await fetch(`/api/admin/users?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [user]);

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!user || user.role !== "admin") return;
    if (user.id === targetUserId) {
      alert("Safety Lock: You cannot demote your own account from this dashboard.");
      return;
    }

    const confirm = window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`);
    if (!confirm) return;
    
    setProcessingId(targetUserId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          targetUserId,
          newRole
        })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => 
          u.id === targetUserId ? { ...u, role: newRole as any } : u
        ));
        alert("User role updated successfully.");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update role.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'vendor': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200'; // customer
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-2 font-medium">Control platform access, elevate admins, and manage vendors.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Manage Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading registered users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No users found.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const safeName = u.displayName ?? "Unknown User";
                  const isSelf = user?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isSelf ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                            {u.photoURL ? (
                              <Image src={u.photoURL} alt={safeName} width={40} height={40} className="object-cover" />
                            ) : (
                              safeName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {safeName}
                              {isSelf && <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">YOU</span>}
                            </p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{u.id.slice(0, 10)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 font-medium">{u.email || "No email"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${getRoleBadge(u.role || 'customer')}`}>
                          {u.role || 'customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {processingId === u.id ? (
                          <span className="text-sm font-bold text-slate-400">Updating...</span>
                        ) : (
                          <select
                            disabled={isSelf}
                            value={u.role || "customer"}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`text-sm border rounded-lg px-3 py-2 outline-none font-medium cursor-pointer ${
                              isSelf 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary text-slate-700'
                            }`}
                          >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                            <option value="admin">Admin</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}