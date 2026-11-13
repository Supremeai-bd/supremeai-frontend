import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreditCard,
  Zap,
  Download,
  CheckCircle,
  PieChart,
  Activity,
  Wallet,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { BillingInvoice, ChatSession, PlanTier } from '../../types';
import { MODEL_USAGE_BREAKDOWN } from '../../data/customerWorkspaceData';
import { usageService, WalletData, BillingAnalytics, DailyUsageMetric } from '../../services/usageService';
import { toast } from '../../stores/useToastStore';

interface UserPlanUsageViewProps {
  planTier: PlanTier;
  invoices: BillingInvoice[];
  currentTokensUsed: number;
  tokensLimit: number;
  sessions: ChatSession[];
  darkMode?: boolean;
  onTopUpTokens: (addedTokens: number, costUsd: number) => void;
  developerMode?: boolean;
}

interface DayActivity {
  date: string;
  dayName: string;
  userMessages: number;
  assistantMessages: number;
  totalMessages: number;
  estimatedTokens: number;
}

export const UserPlanUsageView: React.FC<UserPlanUsageViewProps> = ({
  planTier,
  invoices,
  currentTokensUsed,
  tokensLimit,
  sessions,
  darkMode,
  onTopUpTokens,
  developerMode = false,
}) => {
  const [sectionTab, setSectionTab] = useState<'overview' | 'activity' | 'invoices'>('overview');
  const [metricView, setMetricView] = useState<'stacked' | 'total'>('stacked');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedTopUpTier, setSelectedTopUpTier] = useState<{ tokens: number; cost: number }>({
    tokens: 2500000,
    cost: 50,
  });
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [dbMetrics, setDbMetrics] = useState<DailyUsageMetric[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      usageService.getWallet(),
      usageService.getAnalytics(),
      usageService.getUsageMetrics(7),
    ]).then(([w, a, m]) => {
      if (!isMounted) return;
      if (w) setWallet(w);
      if (a) setAnalytics(a);
      if (m && m.length > 0) setDbMetrics(m);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const usagePercent = Math.min(100, Math.round((currentTokensUsed / Math.max(1, tokensLimit)) * 100));

  const activityData: DayActivity[] = useMemo(() => {
    const days: DayActivity[] = [];
    const now = new Date();
    const baselineDays = [
      { offset: 6, user: 14, assistant: 15, tokens: 28400 },
      { offset: 5, user: 22, assistant: 24, tokens: 46200 },
      { offset: 4, user: 19, assistant: 20, tokens: 39100 },
      { offset: 3, user: 31, assistant: 33, tokens: 68500 },
      { offset: 2, user: 27, assistant: 28, tokens: 55400 },
      { offset: 1, user: 38, assistant: 40, tokens: 81200 },
      { offset: 0, user: 12, assistant: 12, tokens: 24800 },
    ];

    const sessionDayCounts: Record<string, { user: number; assistant: number }> = {};
    sessions.forEach((s) => {
      s.messages.forEach((m) => {
        const dateKey = new Date(m.timestamp).toISOString().slice(0, 10);
        if (!sessionDayCounts[dateKey]) {
          sessionDayCounts[dateKey] = { user: 0, assistant: 0 };
        }
        if (m.role === 'user') sessionDayCounts[dateKey].user++;
        if (m.role === 'assistant') sessionDayCounts[dateKey].assistant++;
      });
    });

    baselineDays.forEach(({ offset, user, assistant, tokens }) => {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - offset);
      const dateKey = targetDate.toISOString().slice(0, 10);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dbMatch = dbMetrics.find((m) => m.metric_date === dateKey);
      const real = sessionDayCounts[dateKey] || { user: 0, assistant: 0 };
      const totalUser = user + real.user;
      const totalAssistant = assistant + real.assistant;
      const total = totalUser + totalAssistant;
      const totalTokens = dbMatch ? dbMatch.total_tokens : tokens + (real.user + real.assistant) * 650;

      days.push({
        date: dateKey,
        dayName,
        userMessages: totalUser,
        assistantMessages: totalAssistant,
        totalMessages: total,
        estimatedTokens: totalTokens,
      });
    });

    return days;
  }, [sessions, dbMetrics]);

  const totalMessages7Days = activityData.reduce((acc, d) => acc + d.totalMessages, 0);
  const totalTokens7Days = activityData.reduce((acc, d) => acc + d.estimatedTokens, 0);
  const avgMessagesPerDay = Math.round(totalMessages7Days / 7);
  const peakDay = activityData.reduce(
    (max, cur) => (cur.totalMessages > max.totalMessages ? cur : max),
    activityData[0]
  );

  const handleTopUpConfirm = () => {
    onTopUpTokens(selectedTopUpTier.tokens, selectedTopUpTier.cost);
    setTopUpSuccess(true);
    setTimeout(() => {
      setTopUpSuccess(false);
      setIsTopUpModalOpen(false);
    }, 1200);
  };

  const handleDownloadReceipt = (inv: BillingInvoice) => {
    const content = `SupremeAI Studio Receipt\nInvoice: ${inv.invoiceNumber}\nItem: ${inv.planName}\nDate: ${inv.date}\nAmount: $${inv.amountUsd.toFixed(2)}\nStatus: ${inv.status}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt Downloaded', `${inv.invoiceNumber}.txt saved.`);
  };

  const planPriceLabel =
    planTier === 'Enterprise' ? '$199.00 / month' : planTier === 'Pro' ? '$29.00 / month' : '$0.00 / month';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayActivity;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1.5 font-sans z-50">
          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4">
            <span>{data.dayName} · {data.date}</span>
            <span className="font-mono tabular-nums text-slate-500">{data.totalMessages} msgs</span>
          </div>
          <div className="pt-1 space-y-1 text-[11px] border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span>{developerMode ? 'User Prompts:' : 'Your Prompts:'}</span>
              <span className="font-mono font-semibold tabular-nums">{data.userMessages}</span>
            </div>
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
              <span>{developerMode ? 'Gemini Responses:' : 'Assistant Replies:'}</span>
              <span className="font-mono font-semibold tabular-nums">{data.assistantMessages}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
              <span>{developerMode ? 'Tokens:' : 'Credits used:'}</span>
              <span className="font-mono tabular-nums">~{(data.estimatedTokens / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 workspace-container space-y-6 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {developerMode ? 'Plan, Billing & Token Usage' : 'Plan, Usage & Billing'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {developerMode
              ? 'Monitor monthly Gemini quota, 7-day chat telemetry, credit top-ups, and Stripe billing receipts.'
              : 'Track your monthly allowance, 7-day activity, credit top-ups, and billing receipts.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTopUpModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold theme-btn-primary cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Zap className="w-4 h-4" />
          <span>Top Up Credits</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit text-xs border border-slate-200/70 dark:border-slate-700/60">
        {(
          [
            { id: 'overview', label: 'Overview & Quota' },
            { id: 'activity', label: '7-Day Activity' },
            { id: 'invoices', label: 'Invoices & Top-Up' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSectionTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              sectionTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sectionTab === 'overview' && (
        <div className="space-y-6">
          {/* Plan Card & Token Meter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-blue-100">
                  Current Plan
                </span>
                <span className="font-mono text-blue-100">Monthly</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{planTier} Plan</h2>
                <p className="text-xs text-blue-100 mt-0.5 font-mono">{planPriceLabel} · Auto-renew active</p>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-white/20 text-xs text-blue-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Gemini 3.8 Flash & High-Speed Models</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Multi-Seat Team Collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Priority Streaming & Deep Research</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {developerMode ? 'Monthly Token Consumption' : 'Monthly Credits'}
                  </h3>
                  <p className="text-xs text-slate-400">Active billing cycle quota</p>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold theme-accent-text">
                  {currentTokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} {developerMode ? 'tokens' : 'credits'}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent > 85 ? 'bg-amber-500' : 'bg-[var(--theme-accent)]'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span>{usagePercent}% utilized</span>
                <span>{Math.max(0, tokensLimit - currentTokensUsed).toLocaleString()} {developerMode ? 'tokens' : 'credits'} remaining</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {developerMode
                    ? 'Need extra token capacity for large reasoning runs?'
                    : 'Need extra capacity for larger writing or research projects?'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="theme-accent-text font-semibold hover:underline cursor-pointer"
                >
                  Add Pay-As-You-Go
                </button>
              </div>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Usage Breakdown by Model
                </h3>
              </div>
              <span className="text-xs text-slate-400">Current Cycle</span>
            </div>

            <div className="space-y-3.5">
              {MODEL_USAGE_BREAKDOWN.map((item) => (
                <div key={item.model} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.model}
                    </span>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
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
        </div>
      )}

      {sectionTab === 'activity' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {developerMode ? 'Wallet Balance' : 'Account Credit'}
                </span>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  ${wallet ? wallet.balanceUsd.toFixed(2) : '125.50'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Allowance: ${wallet ? wallet.monthlyAllowanceUsd.toFixed(2) : '500.00'}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {developerMode ? 'Model Spend' : 'Usage Cost'}
                </span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  ${analytics ? analytics.totalSpent.toFixed(2) : '14.85'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {developerMode ? 'Cache Saved' : 'Smart Savings'}: +${analytics ? analytics.totalSaved.toFixed(2) : '32.40'}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {developerMode ? '7-Day Ingestion' : '7-Day Messages'}
                </span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {developerMode ? `${(totalTokens7Days / 1000).toFixed(1)}k` : totalMessages7Days}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {developerMode
                    ? `Peak: ${peakDay?.dayName} (${(peakDay?.estimatedTokens / 1000).toFixed(1)}k)`
                    : `Peak: ${peakDay?.dayName} (${peakDay?.totalMessages} msgs)`}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {developerMode ? 'Daily Rate' : 'Daily Average'}
                </span>
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {avgMessagesPerDay} <span className="text-xs font-normal text-slate-400 font-sans">msgs/day</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                  {totalMessages7Days} {developerMode ? 'total turns' : 'total messages'}
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Message Activity (Last 7 Days)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {developerMode
                    ? 'Interactive breakdown of user prompts and Gemini responses.'
                    : 'Interactive breakdown of your prompts and assistant replies.'}
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setMetricView('stacked')}
                  className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                    metricView === 'stacked' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {developerMode ? 'User vs AI' : 'You vs Assistant'}
                </button>
                <button
                  type="button"
                  onClick={() => setMetricView('total')}
                  className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                    metricView === 'total' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Total
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
                  <XAxis dataKey="dayName" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  {metricView === 'stacked' ? (
                    <>
                      <Bar dataKey="userMessages" name={developerMode ? 'User Prompts' : 'Your Prompts'} stackId="a" fill="#3B82F6" maxBarSize={44} />
                      <Bar dataKey="assistantMessages" name={developerMode ? 'Gemini Responses' : 'Assistant Replies'} stackId="a" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </>
                  ) : (
                    <Bar dataKey="totalMessages" name="Total Messages" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {sectionTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Invoice History & Receipts</span>
            </h3>
            <span className="text-xs text-slate-400">
              {developerMode ? 'Processed via Stripe' : 'Billing receipts'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Billing Item</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-900 dark:text-white font-semibold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{inv.planName}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{inv.date}</td>
                      <td className="px-4 py-3.5 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        ${inv.amountUsd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium capitalize">
                        {inv.status}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(inv)}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Pay-As-You-Go Token Top-Up</span>
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
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Credits Added!</h4>
                <p className="text-xs text-slate-500 font-mono">
                  +{selectedTopUpTier.tokens.toLocaleString()} tokens credited to your balance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tokens never expire and apply across all permitted Gemini models.
                </p>

                <div className="space-y-2.5">
                  {[
                    { tokens: 1250000, cost: 25, label: 'Standard Boost' },
                    { tokens: 2500000, cost: 50, label: 'Popular Package (+10% Bonus)' },
                    { tokens: 6000000, cost: 100, label: 'Power Package (+20% Bonus)' },
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
                        <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {pkg.tokens.toLocaleString()} Tokens
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {pkg.label}
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
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
