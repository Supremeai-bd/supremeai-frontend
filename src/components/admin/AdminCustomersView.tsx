import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Plus,
  Shield,
  CreditCard,
  Gauge,
  MoreVertical,
  Check,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  GitBranch,
  DollarSign,
  UserCheck,
  UserX,
} from 'lucide-react';
import { CustomerRecord } from '../../types';

interface AdminCustomersViewProps {
  customers: CustomerRecord[];
  onAddCustomer: (customer: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<CustomerRecord>) => void;
  onDeleteCustomer: (id: string) => void;
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'Paid' | 'Enterprise' | 'Free'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'suspended'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Add Customer Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState<'Free' | 'Pro' | 'Enterprise'>('Pro');
  const [newStatus, setNewStatus] = useState<'active' | 'past_due' | 'suspended'>('active');
  const [newGithub, setNewGithub] = useState('');
  const [newRegion, setNewRegion] = useState('Asia/Dhaka');

  // Filter logic
  const filteredCustomers = customers.filter((cust) => {
    const matchesTier =
      tierFilter === 'all'
        ? true
        : tierFilter === 'Paid'
        ? cust.tier === 'Pro' || cust.tier === 'Enterprise'
        : cust.tier === tierFilter;

    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      cust.name.toLowerCase().includes(query) ||
      cust.email.toLowerCase().includes(query) ||
      (cust.githubHandle && cust.githubHandle.toLowerCase().includes(query)) ||
      cust.region.toLowerCase().includes(query);

    return matchesTier && matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalCount = customers.length;
  const paidCount = customers.filter((c) => c.tier === 'Pro' || c.tier === 'Enterprise').length;
  const enterpriseCount = customers.filter((c) => c.tier === 'Enterprise').length;
  const freeCount = customers.filter((c) => c.tier === 'Free').length;
  const totalMRR = customers.reduce((acc, c) => acc + c.mrr, 0);
  const totalTokens = customers.reduce((acc, c) => acc + c.tokensUsed, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const mrr = newTier === 'Enterprise' ? 199 : newTier === 'Pro' ? 29 : 0;
    const tokenLimit = newTier === 'Enterprise' ? 5000000 : newTier === 'Pro' ? 1000000 : 100000;

    onAddCustomer({
      name: newName.trim(),
      email: newEmail.trim(),
      tier: newTier,
      status: newStatus,
      mrr,
      tokensUsed: 0,
      tokenLimit,
      connectedRepos: 0,
      githubHandle: newGithub.trim() || undefined,
      region: newRegion.trim() || 'Global',
    });

    setNewName('');
    setNewEmail('');
    setNewGithub('');
    setIsAddModalOpen(false);
  };

  const exportCSV = () => {
    const headers = ['ID,Name,Email,Tier,Status,MRR($),Tokens_Used,Token_Limit,Connected_Repos,Joined_Date,Region'];
    const rows = filteredCustomers.map((c) =>
      `"${c.id}","${c.name}","${c.email}","${c.tier}","${c.status}",${c.mrr},${c.tokensUsed},${c.tokenLimit},${c.connectedRepos},"${c.joinedDate}","${c.region}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supremeai_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTierStyle = (tier: CustomerRecord['tier']) => {
    switch (tier) {
      case 'Enterprise':
        return 'text-purple-600 dark:text-purple-400 font-semibold';
      case 'Pro':
        return 'text-blue-600 dark:text-blue-400 font-semibold';
      default:
        return 'text-slate-500 dark:text-slate-400 font-medium';
    }
  };

  const getStatusStyle = (status: CustomerRecord['status']) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 dark:text-emerald-400 font-medium';
      case 'past_due':
        return 'text-amber-600 dark:text-amber-400 font-medium';
      case 'suspended':
        return 'text-rose-600 dark:text-rose-400 font-medium';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer & Account Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time subscriber management across Free, Pro, and Enterprise tiers with token quota telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Customers
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {totalCount}
          </div>
          <span className="text-[10px] text-slate-400">All registered users</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Paid / Pro Users
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {paidCount} <span className="text-xs font-normal text-slate-400 font-sans">({Math.round((paidCount / totalCount) * 100)}%)</span>
          </div>
          <span className="text-[10px] text-slate-400">{enterpriseCount} Enterprise + {paidCount - enterpriseCount} Pro</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Free Tier Users
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {freeCount}
          </div>
          <span className="text-[10px] text-slate-400">Basic 100K token quota</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Platform MRR
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            ${totalMRR.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Monthly recurring rev</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Token Ingestion
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {(totalTokens / 1000000).toFixed(1)}M
          </div>
          <span className="text-[10px] text-slate-400">Gemini tokens consumed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
        {/* Tier Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            type="button"
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              tierFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Customers ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('Paid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              tierFilter === 'Paid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Paid / Pro ({paidCount})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('Enterprise')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              tierFilter === 'Enterprise'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Enterprise ({enterpriseCount})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('Free')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              tierFilter === 'Free'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Free Tier ({freeCount})
          </button>
        </div>

        {/* Right filters: Search + Status dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, repo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* High-Density Customer Data Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Monthly Spend</th>
                <th className="p-3.5">Monthly Token Usage</th>
                <th className="p-3.5">Repos</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No customers found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const usagePercent = Math.min(
                    100,
                    Math.round((cust.tokensUsed / cust.tokenLimit) * 100)
                  );

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer Name & Email */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              {cust.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="p-3.5">
                        <span className={getTierStyle(cust.tier)}>
                          {cust.tier}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`capitalize ${getStatusStyle(cust.status)}`}>
                          {cust.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Monthly Spend / MRR */}
                      <td className="p-3.5 font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
                        ${cust.mrr}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                      </td>

                      {/* Token Quota Progress */}
                      <td className="p-3.5 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                            <span>{(cust.tokensUsed / 1000).toFixed(0)}k</span>
                            <span>{(cust.tokenLimit / 1000).toFixed(0)}k ({usagePercent}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent > 90
                                  ? 'bg-rose-500'
                                  : usagePercent > 60
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600 dark:bg-blue-400'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Connected Repos */}
                      <td className="p-3.5 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {cust.connectedRepos}
                      </td>

                      {/* Joined Date */}
                      <td className="p-3.5 font-mono tabular-nums text-slate-500">
                        {cust.joinedDate}
                      </td>

                      {/* Last Active */}
                      <td className="p-3.5 text-slate-500 tabular-nums">
                        {cust.lastActive}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            aria-label="Edit customer"
                            title="Edit / Change Plan"
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(cust.id)}
                            aria-label="Delete customer"
                            title="Remove Customer"
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold">Register New Customer</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Plan Tier
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="Free">Free ($0/mo)</option>
                    <option value="Pro">Pro ($29/mo)</option>
                    <option value="Enterprise">Enterprise ($199/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    GitHub Handle
                  </label>
                  <input
                    type="text"
                    value={newGithub}
                    onChange={(e) => setNewGithub(e.target.value)}
                    placeholder="johndoe"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="Asia/Dhaka"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer / Change Plan Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold">Manage Customer: {selectedCustomer.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subscription Plan Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Free', 'Pro', 'Enterprise'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        const mrr = tier === 'Enterprise' ? 199 : tier === 'Pro' ? 29 : 0;
                        const tokenLimit = tier === 'Enterprise' ? 5000000 : tier === 'Pro' ? 1000000 : 100000;
                        onUpdateCustomer(selectedCustomer.id, { tier, mrr, tokenLimit });
                        setSelectedCustomer({ ...selectedCustomer, tier, mrr, tokenLimit });
                      }}
                      className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition-all ${
                        selectedCustomer.tier === tier
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>{tier}</div>
                      <div className="text-[10px] opacity-80">
                        {tier === 'Enterprise' ? '$199/mo' : tier === 'Pro' ? '$29/mo' : '$0'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'past_due', 'suspended'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        onUpdateCustomer(selectedCustomer.id, { status });
                        setSelectedCustomer({ ...selectedCustomer, status });
                      }}
                      className={`p-2 rounded-lg border text-center capitalize font-medium cursor-pointer transition-all ${
                        selectedCustomer.status === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Reset Token Quota</span>
                  <span className="text-slate-400 text-[11px]">Clear currently consumed tokens back to 0</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateCustomer(selectedCustomer.id, { tokensUsed: 0 });
                    setSelectedCustomer({ ...selectedCustomer, tokensUsed: 0 });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Reset Quota
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
