"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/AuthProvider";

interface SearchLog {
  id: string;
  query: string;
  userId: string;
  userEmail: string | null;
  createdAt: any;
}

export default function AdminSearchesPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchLogs = async () => {
      if (!user || user.role !== "admin") return;

      try {
        // Fetch the 100 most recent searches
        const q = query(
          collection(db, "search_queries"),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedLogs: SearchLog[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedLogs.push({ id: doc.id, ...doc.data() } as SearchLog);
        });
        
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to fetch search logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchLogs();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-10 bg-slate-200 rounded-lg w-1/3 mb-6"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Search Logs</h1>
          <p className="text-slate-600 mt-2 font-medium">See exactly what the Kabale community is looking for.</p>
        </div>
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm border border-purple-100 shadow-sm flex items-center gap-2">
          <span>🔍</span> {logs.length} Recent Queries
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-black">
                <th className="px-6 py-4">Search Query</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No searches recorded yet. Try searching for something on the homepage!
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  // Format the date safely
                  const date = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          "{log.query}"
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.userEmail ? (
                          <span className="text-sm font-medium text-sky-600">{log.userEmail}</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">Anonymous</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{formattedDate}</span>
                          <span className="text-xs text-slate-400 font-medium">{formattedTime}</span>
                        </div>
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
