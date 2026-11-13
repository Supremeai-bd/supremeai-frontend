import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  Download,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { BillingInvoice } from '../../types';
import { MODEL_USAGE_BREAKDOWN } from '../../data/customerWorkspaceData';

interface UserBillingViewProps {
  invoices: BillingInvoice[];
  currentTokensUsed: number;
  tokensLimit: number;
  onTopUpTokens: (addedTokens: number, costUsd: number) => void;
}

export const UserBillingView: React.FC<UserBillingViewProps> = ({
  invoices,
  currentTokensUsed,
  tokensLimit,
  onTopUpTokens,
}) => {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedTopUpTier, setSelectedTopUpTier] = useState<{ tokens: number; cost: number }>({
    tokens: 2500000,
    cost: 50,
  });
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const usagePercent = Math.min(100, Math.round((currentTokensUsed / tokensLimit) * 100));

  const handleTopUpConfirm = () => {
    onTopUpTokens(selectedTopUpTier.tokens, selectedTopUpTier.cost);
    setTopUpSuccess(true);
    setTimeout(() => {
      setTopUpSuccess(false);
      setIsTopUpModalOpen(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 workspace-container space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Billing, Subscriptions & Token Quota
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              Stripe Auto-Pay Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track token usage, purchase pay-as-you-go credit packages, manage team subscription tiers, and download invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTopUpModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>Top Up Credits</span>
        </button>
      </div>

      {/* Plan Card & Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plan Overview */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Current Plan
            </span>
            <span className="text-xs font-mono font-medium">Billed Monthly</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Developer Pro</h2>
            <p className="text-xs text-blue-100 mt-0.5">$49.00 / month · Auto-renews May 01, 2026</p>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-white/20 text-xs text-blue-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Full SupremeAI Core & Reason Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>10 Multi-Seat Collaborator Slots</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Unlimited RAG Knowledge Vectorization</span>
            </div>
          </div>
        </div>

        {/* Token Balance Gauge */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Token Consumption</h3>
              <p className="text-xs text-slate-400">Resets in 18 days</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              {currentTokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} Tokens
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 85 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>{usagePercent}% Quota Ingested</span>
            <span>{(tokensLimit - currentTokensUsed).toLocaleString()} Tokens Remaining</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Need high-concurrency burst capacity for batch AST analysis?</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTopUpModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Add Pay-As-You-Go
            </button>
          </div>
        </div>
      </div>

      {/* Model-by-Model Cost & Usage Breakdown */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Granular Usage Breakdown by Model
            </h3>
          </div>
          <span className="text-xs text-slate-400">Current Billing Cycle</span>
        </div>

        <div className="space-y-3.5">
          {MODEL_USAGE_BREAKDOWN.map((item) => (
            <div key={item.model} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.model}
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-400">{item.tokens.toLocaleString()} tokens ({item.percentage}%)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.cost}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Invoice History & Receipts
          </h3>
          <span className="text-xs text-slate-400">All payments processed via Stripe</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Billing Item</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-900 dark:text-white font-semibold">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {inv.planName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{inv.date}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      ${inv.amountUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Paid
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => alert(`Downloading PDF for invoice ${inv.invoiceNumber}...`)}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- TOP-UP CREDITS MODAL --- */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Pay-As-You-Go Token Top-Up
              </h3>
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {topUpSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Successful!
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedTopUpTier.tokens.toLocaleString()} tokens added to your quota.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tokens never expire and apply across all SupremeAI models.
                </p>

                <div className="space-y-2.5">
                  {[
                    { tokens: 1250000, cost: 25, label: 'Standard Boost' },
                    { tokens: 2500000, cost: 50, label: 'Popular Package (+10% Bonus)' },
                    { tokens: 6000000, cost: 100, label: 'Power Developer (+20% Bonus)' },
                  ].map((pkg) => (
                    <div
                      key={pkg.cost}
                      onClick={() => setSelectedTopUpTier({ tokens: pkg.tokens, cost: pkg.cost })}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedTopUpTier.cost === pkg.cost
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {pkg.tokens.toLocaleString()} Tokens
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {pkg.label}
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        ${pkg.cost}.00
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTopUpConfirm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                  >
                    Confirm & Charge ${selectedTopUpTier.cost}.00
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
