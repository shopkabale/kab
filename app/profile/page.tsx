"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { Order } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const res = await fetch(`/api/orders/user?userId=${user.id}`);
        const data = await res.json();
        
        if (res.ok) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      setLoadingOrders(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return <div className="py-20 text-center text-slate-500">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Log In</h2>
        <p className="text-slate-600">You must be logged in to view your profile and orders.</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
        {user.photoURL ? (
          <Image 
            src={user.photoURL} 
            alt={user.displayName} 
            width={96} 
            height={96} 
            className="rounded-full border border-slate-200"
          />
        ) : (
          <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold">
            {user.displayName.charAt(0)}
          </div>
        )}
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-900">{user.displayName}</h1>
          <p className="text-slate-500">{user.email}</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 uppercase tracking-wide">
            Role: {user.role}
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <h2 className="text-xl font-bold text-slate-900 mb-4">My Orders</h2>
      
      {loadingOrders ? (
        <div className="text-center py-8 text-slate-500">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-4">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold text-primary mb-1">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </p>
                <div className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Total:</span> UGX {order.total.toLocaleString()} (Cash on Delivery)
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}