"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { User } from "@/types";

export default function AdminVerificationPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerificationRequests = async () => {
      if (!user || user.role !== "admin") return;
      try {
        // Reusing your existing users endpoint, but you can create a specific one if preferred
        const res = await fetch(`/api/admin/users?adminId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only show users who have interacted with the verification system
          const verificationUsers = (data.users || []).filter(
            (u: any) => u.verificationStatus && u.verificationStatus !== "unverified"
          );
          
          // Sort so pending requests are always at the top
          verificationUsers.sort((a: any, b: any) => {
            if (a.verificationStatus === "pending" && b.verificationStatus !== "pending") return -1;
            if (a.verificationStatus !== "pending" && b.verificationStatus === "pending") return 1;
            return (b.verificationRequestedAt || 0) - (a.verificationRequestedAt || 0);
          });

          setUsers(verificationUsers);
        }
      } catch (error) {
        console.error("Failed to fetch verifications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationRequests();
  }, [user]);

  const handleVerificationChange = async (targetUserId: string, newStatus: string) => {
    if (!user || user.role !== "admin") return;

    const confirm = window.confirm(`Change this user's verification status to ${newStatus.toUpperCase()}?`);
    if (!confirm) return;

    setProcessingId(targetUserId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          targetUserId,
          newStatus
        })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => 
          u.id === targetUserId ? { ...u, verificationStatus: newStatus as any } : u
        ));
        alert("Verification status updated successfully.");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Verification Requests</h1>
        <p className="text-slate-600 mt-2 font-medium">Review pending seller profiles and grant trusted badges.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Requested On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No pending verification requests.</td>
                </tr>
              ) : (
                users.map((u: any) => {
                  const safeName = u.displayName ?? "Unknown User";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold overflow-hidden flex-shrink-0 border border-slate-200">
                            {u.photoURL ? (
                              <Image src={u.photoURL} alt={safeName} width={40} height={40} className="object-cover" />
                            ) : (
                              safeName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {safeName}
                            </p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{u.id.slice(0, 10)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 font-medium">{u.email || "No email"}</p>
                        {u.phoneNumber && <p className="text-xs text-slate-500 mt-0.5">{u.phoneNumber}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {u.verificationRequestedAt ? new Date(u.verificationRequestedAt).toLocaleDateString() : "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${getStatusBadge(u.verificationStatus || 'unverified')}`}>
                          {u.verificationStatus || 'unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {processingId === u.id ? (
                          <span className="text-sm font-bold text-slate-400">Updating...</span>
                        ) : (
                          <select
                            value={u.verificationStatus || "unverified"}
                            onChange={(e) => handleVerificationChange(u.id, e.target.value)}
                            className="bg-white border-slate-300 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-slate-700 text-sm border rounded-lg px-3 py-2 outline-none font-medium cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                            <option value="unverified">Unverified (Revoke)</option>
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
