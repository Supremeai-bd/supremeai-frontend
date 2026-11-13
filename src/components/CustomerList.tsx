import React, { useEffect, useState } from 'react';
import { customerService } from '../services/customerService';
import { CustomerRecord } from '../types';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCustomers = async () => {
      try {
        const data = await customerService.fetchCustomers();
        if (isMounted) setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">
        লোডিং...
      </div>
    );
  }

  return (
    <div className="customer-list p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-200">
      <h2 className="text-xl font-bold mb-4 text-white">কাস্টমার তালিকা</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 px-3">নাম</th>
              <th className="py-2 px-3">ইমেইল</th>
              <th className="py-2 px-3">টিয়ার</th>
              <th className="py-2 px-3">স্ট্যাটাস</th>
              <th className="py-2 px-3">MRR</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                <td className="py-2 px-3 font-medium text-white">{customer.name}</td>
                <td className="py-2 px-3 text-slate-400">{customer.email}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      customer.tier === 'Enterprise'
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                        : customer.tier === 'Pro'
                        ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {customer.tier}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      customer.status === 'active'
                        ? 'text-emerald-400'
                        : customer.status === 'past_due'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-cyan-400">${customer.mrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
