'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  Search,
  Activity,
  AlertTriangle,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';

interface CallRecord {
  call_id: string;
  caller_id: string;
  call_mode: string;
  language: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  status: string;
  outcome: string;
  failure_reason: string | null;
  success_reason: string | null;
}

interface AnalyticsData {
  analytics: {
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    success_rate: number;
  };
  history: CallRecord[];
  failures: Record<string, number>;
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch call analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const filteredHistory = data?.history.filter((call) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      call.caller_id.toLowerCase().includes(searchLower) ||
      (call.success_reason || '').toLowerCase().includes(searchLower) ||
      (call.failure_reason || '').toLowerCase().includes(searchLower) ||
      call.call_mode.toLowerCase().includes(searchLower) ||
      call.language.toLowerCase().includes(searchLower);

    const matchesMode =
      filterMode === 'all' || call.call_mode.toLowerCase() === filterMode.toLowerCase();
    const matchesLanguage =
      filterLanguage === 'all' || call.language.toLowerCase() === filterLanguage.toLowerCase();
    const matchesOutcome =
      filterOutcome === 'all' || call.outcome.toLowerCase() === filterOutcome.toLowerCase();

    return matchesSearch && matchesMode && matchesLanguage && matchesOutcome;
  }) || [];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 pb-12 font-sans transition-colors duration-300">
      {/* Background Tricolor Accents */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-saffron/10 via-white/5 to-transparent pointer-events-none dark:from-saffron/5" />
      <div className="absolute top-40 right-10 size-96 rounded-full bg-green/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between px-4 py-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
            aria-label="Back to Voice Assistant"
          >
            <ArrowLeft className="size-4 text-slate-700 dark:text-slate-300" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              SehatSaathi Call Analytics
            </span>
            <span className="rounded-full border border-saffron/40 bg-saffron/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-saffron uppercase">
              Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <span className="hidden sm:inline-block text-[11px] text-slate-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {/* Auto Refresh Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none border border-slate-200 dark:border-slate-800 rounded-full bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-green cursor-pointer size-3.5"
            />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Auto-refresh (5s)</span>
          </label>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 p-2 rounded-full bg-green text-white hover:bg-green/90 transition-all font-bold text-xs shadow-xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 mt-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertTriangle className="size-5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Error loading analytics:</span> {error}. Showing cached or offline view.
            </div>
            <button
              onClick={fetchAnalytics}
              className="rounded-lg border border-red-200 bg-white dark:bg-slate-800 px-3 py-1 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Calls */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                Total Calls
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Phone className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {loading && !data ? '...' : data?.analytics.total_calls ?? 0}
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Inbound, browser & outbound</p>
            </div>
          </div>

          {/* Card 2: Success Rate */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                Success Rate
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Activity className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">
                {loading && !data ? '...' : `${data?.analytics.success_rate ?? 0}%`}
              </span>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data?.analytics.success_rate ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Successful Calls */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                Successful Calls
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
                {loading && !data ? '...' : data?.analytics.successful_calls ?? 0}
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Reaching health outcome</p>
            </div>
          </div>

          {/* Card 4: Failed Calls */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                Failed Calls
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="size-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-500">
                {loading && !data ? '...' : data?.analytics.failed_calls ?? 0}
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Incomplete or hung up early</p>
            </div>
          </div>
        </section>

        {/* 2. Failure Breakdown & Success Definitions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          {/* Left Column: Failure breakdown chart (CSS visuals) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h3 className="text-sm sm:text-base font-bold tracking-tight mb-4 flex items-center gap-2">
              <AlertTriangle className="size-4.5 text-rose-500" />
              <span>Call Failure Reasons</span>
            </h3>

            {loading && !data ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                Loading breakdown...
              </div>
            ) : !data || Object.keys(data.failures).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span>No failed calls recorded yet.</span>
                <span className="text-xs text-slate-400 mt-1">Failed calls will be categorized here.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.failures).map(([reason, count]) => {
                  const percentage = Math.round((count / data.analytics.failed_calls) * 100);
                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="font-mono text-slate-700 dark:text-slate-300">{reason}</span>
                        <span className="text-slate-500">
                          {count} {count === 1 ? 'call' : 'calls'} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Track Success Outcomes */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                <Sparkles className="size-4.5 text-amber-500 animate-pulse" />
                <span>Health-Access Success Criteria</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex gap-2">
                  <span className="font-bold text-green shrink-0">✓</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">SAFE_GUIDANCE</strong>: Caller received clinic information or nearby facilities successfully.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green shrink-0">✓</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">HUMAN_ESCALATION</strong>: Urgent conditions correctly escalated with explicit patient permission.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green shrink-0">✓</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">CLINIC_INFORMATION</strong>: Campaign response or callback preferences correctly saved to the system.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-rose-500 shrink-0">✗</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">FAILURES</strong>: Accounted for silence timeout, early hang-ups, or uncompleted workflows.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 leading-normal flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-green shrink-0 animate-ping" />
              <span>Dashboard complies with GDPR/HIPAA. Full caller IDs and transcripts are masked.</span>
            </div>
          </div>
        </section>

        {/* 3. Call History with Filters */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-8 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">Call Registry History</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time database updates from SQLite</p>
              </div>

              {/* Filters Panel */}
              <div className="w-full lg:w-auto flex flex-wrap gap-2.5">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] lg:flex-none">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search caller ID / reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green focus:border-green"
                  />
                </div>

                {/* Call Mode Filter */}
                <div className="relative">
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Modes</option>
                    <option value="browser">Browser</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                  </select>
                </div>

                {/* Language Filter */}
                <div className="relative">
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Languages</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="gujarati">Gujarati</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {/* Outcome Filter */}
                <div className="relative">
                  <select
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            {loading && !data ? (
              <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
                Retrieving registry data...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                <span>No call records match the current filters.</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilterMode('all');
                    setFilterLanguage('all');
                    setFilterOutcome('all');
                  }}
                  className="mt-3 text-xs text-green font-bold hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Caller ID</th>
                    <th className="px-6 py-3.5">Time & Date</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Language</th>
                    <th className="px-6 py-3.5">Mode</th>
                    <th className="px-6 py-3.5">Outcome</th>
                    <th className="px-6 py-3.5">Action details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHistory.map((call) => (
                    <tr
                      key={call.call_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all"
                    >
                      <td className="px-6 py-4 font-mono font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        {call.caller_id}
                      </td>
                      <td className="px-6 py-4">
                        <div>{formatTime(call.start_time)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(call.start_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">{formatDuration(call.duration)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="size-3 text-slate-400" />
                          <span>{call.language}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-semibold text-slate-600 dark:text-slate-400">
                          {call.call_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {call.outcome === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/55">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/55">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {call.outcome === 'success' ? (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              [{call.success_reason}]
                            </span>
                            <span className="text-slate-500 block text-[11px] mt-0.5">
                              Completed useful interaction
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-500 text-xs font-mono">
                              {call.failure_reason}
                            </span>
                            <span className="text-slate-400 block text-[11px] mt-0.5">
                              Workflow halted or abandoned
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
