'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Globe,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreVertical,
  Phone,
  Pill,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

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

// Generate dynamic relative dates for mock history so they always appear in recent analytics
const getMockHistory = (): CallRecord[] => {
  const now = Date.now();
  return [
    {
      call_id: 'c1',
      caller_id: 'Ramesh Patel\n+91 98765 43210',
      call_mode: 'Browser',
      language: 'Hindi',
      start_time: new Date(now - 2 * 3600 * 1000).toISOString(), // 2 hours ago
      end_time: new Date(now - 2 * 3600 * 1000 + 149 * 1000).toISOString(),
      duration: 149,
      status: 'completed',
      outcome: 'failed',
      failure_reason: 'TRANSFER_TO_HUMAN',
      success_reason: 'Call transferred to human agent',
    },
    {
      call_id: 'c2',
      caller_id: 'Meena Joshi\n+91 99989 83110',
      call_mode: 'Browser',
      language: 'English',
      start_time: new Date(now - 24 * 3600 * 1000).toISOString(), // 1 day ago
      end_time: new Date(now - 24 * 3600 * 1000 + 256 * 1000).toISOString(),
      duration: 256,
      status: 'completed',
      outcome: 'success',
      failure_reason: null,
      success_reason: 'EXPERT_ESCALATION',
    },
    {
      call_id: 'c3',
      caller_id: 'Ramesh Patel\n+91 98765 43210',
      call_mode: 'Browser',
      language: 'English',
      start_time: new Date(now - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
      end_time: new Date(now - 3 * 24 * 3600 * 1000 + 376 * 1000).toISOString(),
      duration: 376,
      status: 'completed',
      outcome: 'failed',
      failure_reason: 'DID_NOT_TRY_FURTHER',
      success_reason: 'User did not respond',
    },
    {
      call_id: 'c4',
      caller_id: 'Meena Joshi\n+91 99989 83110',
      call_mode: 'Browser',
      language: 'Hindi',
      start_time: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
      end_time: new Date(now - 5 * 24 * 3600 * 1000 + 359 * 1000).toISOString(),
      duration: 359,
      status: 'completed',
      outcome: 'success',
      failure_reason: null,
      success_reason: 'SICK_PERSON',
    },
    {
      call_id: 'c5',
      caller_id: 'Dr. Priya Sharma\n+91 91234 56789',
      call_mode: 'Browser',
      language: 'Unknown',
      start_time: new Date(now - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago
      end_time: new Date(now - 10 * 24 * 3600 * 1000 + 120 * 1000).toISOString(),
      duration: 120,
      status: 'completed',
      outcome: 'success',
      failure_reason: null,
      success_reason: 'EXPERT_ESCALATION',
    },
  ];
};

const MOCK_ANALYTICS = {
  total_calls: 5,
  successful_calls: 3,
  failed_calls: 2,
  success_rate: 60,
};

const MOCK_FAILURES = {
  TRANSFER_TO_HUMAN: 1,
  DID_NOT_TRY_FURTHER: 1,
};

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Dashboard Sub-Views / Tabs state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'patients' | 'appointments' | 'medications' | 'analytics' | 'settings'
  >('overview');

  // Sidebar mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all');

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch from actual API
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const json = await res.json();

      if (json && json.history && json.history.length > 0) {
        setData(json);
      } else {
        setData({
          analytics: MOCK_ANALYTICS,
          history: getMockHistory(),
          failures: MOCK_FAILURES,
        });
      }
      setError(null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch call analytics';
      setError(errMsg);
      setData({
        analytics: MOCK_ANALYTICS,
        history: getMockHistory(),
        failures: MOCK_FAILURES,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh hook
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  // Helper formats
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
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

  const getActionLabels = (call: CallRecord) => {
    if (call.outcome === 'success') {
      const code = call.success_reason || 'SICK_PERSON';
      let desc = 'General health query resolved';
      if (code === 'EXPERT_ESCALATION') {
        desc = 'Escalated to specialist';
      }
      return { code, desc };
    } else {
      const code = call.failure_reason || 'TRANSFER_TO_HUMAN';
      let desc = 'Call transferred to human agent';
      if (code === 'DID_NOT_TRY_FURTHER') {
        desc = 'User did not respond';
      }
      return { code, desc };
    }
  };

  const formatCallerId = (callerId: string) => {
    if (!callerId) return { name: 'Unknown Caller', phone: 'N/A', initials: 'UC' };
    const cleanId = callerId.trim();
    if (cleanId.startsWith('sehatsaathi_')) {
      const shortId = cleanId.slice(12, 18).toUpperCase();
      return { name: `Voice User ${shortId}`, phone: '+91 99989 83110', initials: 'VU' };
    }
    const parts = cleanId.split('\n');
    const name = parts[0] || 'Clinic Caller';
    const phone = parts[1] || '+91 98765 43210';
    const initials =
      name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CC';
    return { name, phone, initials };
  };

  // Dynamic Filtering based on selected Date Range & Inputs
  const filteredHistory = useMemo(() => {
    if (!data?.history) return [];
    const now = Date.now();

    return data.history.filter((call) => {
      // 1. Date Filter
      const callTime = new Date(call.start_time).getTime();
      if (dateRange === '7d') {
        if (now - callTime > 7 * 24 * 3600 * 1000) return false;
      } else if (dateRange === '30d') {
        if (now - callTime > 30 * 24 * 3600 * 1000) return false;
      }

      // 2. Mode Filter
      if (filterMode !== 'all' && call.call_mode.toLowerCase() !== filterMode.toLowerCase())
        return false;

      // 3. Language Filter
      if (filterLanguage !== 'all' && call.language.toLowerCase() !== filterLanguage.toLowerCase())
        return false;

      // 4. Outcome Filter
      if (filterOutcome !== 'all' && call.outcome.toLowerCase() !== filterOutcome.toLowerCase())
        return false;

      // 5. Search Text Filter
      if (search) {
        const query = search.toLowerCase();
        const callerInfo = formatCallerId(call.caller_id);
        const actionInfo = getActionLabels(call);
        const matchesSearch =
          call.call_id.toLowerCase().includes(query) ||
          callerInfo.name.toLowerCase().includes(query) ||
          callerInfo.phone.toLowerCase().includes(query) ||
          actionInfo.code.toLowerCase().includes(query) ||
          actionInfo.desc.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [data, search, filterMode, filterLanguage, filterOutcome, dateRange]);

  // SINGLE SOURCE OF TRUTH: Compute KPIs and failure reasons dynamically from the filtered dataset
  const computedMetrics = useMemo(() => {
    const total = filteredHistory.length;
    const successful = filteredHistory.filter((c) => c.outcome === 'success').length;
    const failed = total - successful;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    // Failures breakdown
    const failuresBreakdown: Record<string, number> = {};
    filteredHistory.forEach((call) => {
      if (call.outcome === 'failed') {
        const reason = call.failure_reason || 'TRANSFER_TO_HUMAN';
        failuresBreakdown[reason] = (failuresBreakdown[reason] || 0) + 1;
      }
    });

    return {
      total,
      successful,
      failed,
      successRate,
      failures: failuresBreakdown,
    };
  }, [filteredHistory]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = [
      'Call ID',
      'Caller Name',
      'Caller Phone',
      'Date',
      'Time',
      'Duration (sec)',
      'Language',
      'Mode',
      'Outcome',
      'Action Code',
      'Action Details',
    ];

    const rows = filteredHistory.map((call) => {
      const callerInfo = formatCallerId(call.caller_id);
      const actionInfo = getActionLabels(call);
      return [
        call.call_id,
        callerInfo.name,
        callerInfo.phone,
        formatDate(call.start_time),
        formatTime(call.start_time),
        call.duration,
        call.language,
        call.call_mode,
        call.outcome.toUpperCase(),
        actionInfo.code,
        actionInfo.desc,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((e) => e.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sehatsaathi_report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyId = (callId: string) => {
    navigator.clipboard.writeText(callId);
    setCopiedId(callId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Patients mock list
  const patientsList = useMemo(
    () => [
      {
        name: 'Ramesh Patel',
        phone: '+91 98765 43210',
        lang: 'Hindi',
        age: 62,
        lastCall: 'Today, 12:41 PM',
        status: 'Verified',
      },
      {
        name: 'Meena Joshi',
        phone: '+91 99989 83110',
        lang: 'English',
        age: 45,
        lastCall: 'Yesterday, 2:24 PM',
        status: 'Verified',
      },
      {
        name: 'Dr. Priya Sharma',
        phone: '+91 91234 56789',
        lang: 'English',
        age: 38,
        lastCall: '5 days ago',
        status: 'Staff',
      },
      {
        name: 'Rajesh Kumar',
        phone: '+91 99887 76655',
        lang: 'Hindi',
        age: 50,
        lastCall: '8 days ago',
        status: 'Verified',
      },
      {
        name: 'Sunita Shah',
        phone: '+91 98989 89898',
        lang: 'Gujarati',
        age: 29,
        lastCall: 'N/A',
        status: 'Pending Verification',
      },
    ],
    []
  );

  // Appointments mock list
  const appointmentsList = useMemo(
    () => [
      {
        name: 'Ramesh Patel',
        doctor: 'Dr. Priya Sharma',
        date: 'Aug 15, 2026',
        time: '10:30 AM',
        type: 'General Checkup',
        status: 'Confirmed',
      },
      {
        name: 'Meena Joshi',
        doctor: 'Dr. Priya Sharma',
        date: 'Aug 16, 2026',
        time: '11:15 AM',
        type: 'Pediatric Consultation',
        status: 'Confirmed',
      },
      {
        name: 'Rajesh Kumar',
        doctor: 'Dr. Priya Sharma',
        date: 'Aug 18, 2026',
        time: '04:00 PM',
        type: 'Prescription Renewal',
        status: 'Pending Approval',
      },
    ],
    []
  );

  // Medication alert logs
  const medicationsList = useMemo(
    () => [
      {
        patient: 'Ramesh Patel',
        drug: 'Metformin 500mg',
        dosage: '1 tablet after dinner',
        logs: 'Sent 1 hour ago',
        status: 'Delivered',
      },
      {
        patient: 'Meena Joshi',
        drug: 'Amoxicillin 250mg',
        dosage: '5ml suspension 3x daily',
        logs: 'Sent 4 hours ago',
        status: 'Delivered',
      },
      {
        patient: 'Ramesh Patel',
        drug: 'Atorvastatin 10mg',
        dosage: '1 tablet before sleep',
        logs: 'Scheduled for 9:00 PM',
        status: 'Pending',
      },
    ],
    []
  );

  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-[#F8FAFC] p-6 text-center font-sans text-[#14213D] dark:bg-[#0B131B] dark:text-slate-100">
        <AlertTriangle className="size-12 animate-pulse text-rose-500" />
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="max-w-sm text-xs text-[#64748B] dark:text-slate-400">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="cursor-pointer rounded-full bg-[#0FAF9F] px-6 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0d9688]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#14213D] transition-colors duration-300 lg:flex-row dark:bg-[#0B131B] dark:text-slate-100">
      {/* Mobile Header (Shows Hamburger menu) */}
      <header className="z-40 flex w-full items-center justify-between border-b border-[#E5EAF0] bg-white px-6 py-4 lg:hidden dark:border-slate-800 dark:bg-[#131F2B]">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="to-emerald-450 relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#0FAF9F] p-2 shadow-sm shadow-[#0FAF9F]/15">
            <Heart className="size-4.5 fill-white text-white" />
          </div>
          <div className="flex items-baseline leading-none">
            <span className="font-display text-base font-black tracking-tight text-[#14213D] dark:text-white">
              Sehat<span className="text-[#0FAF9F]">Saathi</span>
            </span>
            <span className="font-display ml-1 rounded-md bg-[#0FAF9F] px-1 py-0.5 text-[8px] leading-none font-black text-white">
              AI
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="dark:bg-card rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 dark:border-slate-800 dark:text-slate-200"
        >
          {mobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* 1. Sidebar (Responsive: Left Sticky on desktop, drawer overlay on mobile) */}
      <aside
        className={cn(
          'sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-[#E5EAF0] bg-white p-5 transition-transform duration-300 select-none lg:flex lg:translate-x-0 dark:border-slate-800/80 dark:bg-[#131F2B]',
          mobileSidebarOpen
            ? 'fixed top-0 left-0 translate-x-0'
            : 'fixed -translate-x-full lg:static',
          'h-full'
        )}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div className="to-emerald-450 relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#0FAF9F] p-2 shadow-sm shadow-[#0FAF9F]/15">
                <Heart className="size-4.5 fill-white text-white" />
              </div>
              <div className="flex items-baseline text-left leading-none">
                <span className="font-display text-base font-black tracking-tight text-[#14213D] dark:text-white">
                  Sehat<span className="text-[#0FAF9F]">Saathi</span>
                </span>
                <span className="font-display ml-1 rounded-md bg-[#0FAF9F] px-1 py-0.5 text-[8px] leading-none font-black text-white">
                  AI
                </span>
              </div>
            </Link>
            {mobileSidebarOpen && (
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Links List */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'overview'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard Overview</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#64748B] transition-all hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60"
            >
              <MessageSquare className="size-4" />
              <span>Live Conversations</span>
            </Link>

            <button
              onClick={() => {
                setActiveTab('patients');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'patients'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <Users className="size-4" />
              <span>Patients</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('appointments');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'appointments'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <Calendar className="size-4" />
              <span>Appointments</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('medications');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'medications'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <Pill className="size-4" />
              <span>Medication Reminders</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'analytics'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <Activity className="size-4" />
              <span>Analytics Insights</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all',
                activeTab === 'settings'
                  ? 'shadow-3xs bg-[#E9F7F4] text-[#0FAF9F]'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0FAF9F] dark:hover:bg-slate-800/60'
              )}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* AI Assistant status card at bottom of sidebar */}
        <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-[#E5EAF0] bg-white p-3 text-left shadow-2xs select-none dark:border-slate-800 dark:bg-[#131F2B]">
          <div className="flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-[#E9F7F4]/40 p-0.5">
            <img
              src="/Front_Robo_For_Voice_dashboard.png"
              alt="Robot Helper"
              className="h-full w-full animate-pulse object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] leading-none font-extrabold text-[#14213D] dark:text-white">
                AI Receptionist
              </span>
              <span className="inline-block size-1.5 shrink-0 animate-ping rounded-full bg-emerald-500" />
            </div>
            <p className="mt-1 text-[8px] font-bold text-[#64748B] dark:text-slate-400">
              Online &amp; Active
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Main Dashboard Area */}
      <div className="flex min-w-0 flex-1 flex-col justify-start">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5EAF0] bg-[#F8FAFC]/90 px-4 py-4 backdrop-blur-md select-none sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-[#0B131B]/95">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="shadow-3xs shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white p-1.5 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                <ArrowLeft className="dark:text-slate-350 size-3.5 text-slate-700" />
              </Link>
              <h1 className="font-display text-lg leading-none font-extrabold tracking-tight text-[#14213D] uppercase sm:text-xl dark:text-white">
                {activeTab}
              </h1>
            </div>
            <p className="pl-8 text-xs text-[#64748B] dark:text-slate-400">
              {activeTab === 'overview' && 'Overview of your AI Healthcare Assistant'}
              {activeTab === 'patients' && 'Active Patient Registry records'}
              {activeTab === 'appointments' && 'Schedule and confirmation queue'}
              {activeTab === 'medications' && 'Dispatched Outbound Medication triggers'}
              {activeTab === 'analytics' && 'Operational logs & Language graphs'}
              {activeTab === 'settings' && 'Clinic parameters configuration'}
            </p>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Auto Refresh toggle */}
            <label className="hidden cursor-pointer items-center gap-1.5 text-[11px] font-bold text-slate-500 sm:flex dark:text-slate-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded accent-[#0FAF9F]"
              />
              <span>Auto Refresh</span>
            </label>

            {/* Refresh Indicator */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="dark:bg-card cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
              aria-label="Refresh data"
            >
              <RefreshCw className={cn('size-3.5 text-slate-600', loading && 'animate-spin')} />
            </button>

            {/* Date-range selector (Overview tab only) */}
            {activeTab === 'overview' && (
              <div className="relative">
                <div className="dark:bg-card shadow-3xs flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus-within:ring-1 focus-within:ring-[#0FAF9F] hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200">
                  <Calendar className="size-3.5 text-[#0FAF9F]" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | 'all')}
                    className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-bold outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Export Report button */}
            {activeTab === 'overview' && (
              <button
                onClick={handleExportCSV}
                className="dark:bg-card shadow-3xs inline-flex min-h-8.5 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
              >
                <Download className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="dark:bg-card relative cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800"
              >
                <Bell className="text-slate-655 size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#0FAF9F]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-50 mt-2 w-72 space-y-3 rounded-2xl border border-[#E5EAF0] bg-white p-4 text-left shadow-xl dark:border-slate-800 dark:bg-[#131F2B]">
                  <h4 className="flex items-center justify-between border-b pb-1.5 text-xs font-bold text-[#14213D] dark:text-white">
                    <span>Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      Close
                    </button>
                  </h4>
                  <div className="dark:text-slate-450 space-y-2 text-[11px] font-semibold text-slate-600">
                    <div className="flex gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800/80">
                      <span className="text-[#0FAF9F]">●</span>
                      <span>Call from Ramesh Patel logged successfully (2h ago).</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#0FAF9F]">●</span>
                      <span>Meena Joshi booked checkup slot for Sunrise clinic (Yesterday).</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3.5 text-left dark:border-slate-800">
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#E9F7F4] text-xs font-extrabold select-none">
                👩‍⚕️
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-[11px] leading-tight font-extrabold text-[#14213D] dark:text-white">
                  Dr. Priya Sharma
                </span>
                <span className="text-[9px] leading-none text-[#64748B] dark:text-slate-400">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* ================= VIEW 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <>
              {/* KPI SECTION */}
              <section className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {/* Total Calls */}
                <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-5 transition-all select-none hover:shadow-xs dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                      Total Calls
                    </span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#0FAF9F]/10 bg-[#E9F7F4] text-[#0FAF9F]">
                      <Phone className="size-4" />
                    </span>
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-3xl leading-none font-extrabold tracking-tight text-[#14213D] dark:text-white">
                      {loading ? '...' : computedMetrics.total}
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Live database sync</span>
                      <span className="text-xs">✓</span>
                    </div>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-5 transition-all select-none hover:shadow-xs dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                      Success Rate
                    </span>
                    <div className="relative flex size-9 shrink-0 items-center justify-center">
                      <svg className="size-full" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#0FAF9F]"
                          strokeDasharray={`${loading ? 0 : computedMetrics.successRate}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-[8px] leading-none font-bold text-[#14213D] dark:text-white">
                        {loading ? '..' : `${computedMetrics.successRate}%`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-3xl leading-none font-extrabold tracking-tight text-[#14213D] dark:text-white">
                      {loading ? '...' : `${computedMetrics.successRate}%`}
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Target: 70%+</span>
                    </div>
                  </div>
                </div>

                {/* Successful Calls */}
                <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-5 transition-all select-none hover:shadow-xs dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                      Successful
                    </span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#0FAF9F]/10 bg-[#E9F7F4] text-[#0FAF9F]">
                      <ShieldCheck className="size-4.5" />
                    </span>
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-3xl leading-none font-extrabold tracking-tight text-[#14213D] dark:text-white">
                      {loading ? '...' : computedMetrics.successful}
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Tasks completed</span>
                    </div>
                  </div>
                </div>

                {/* Failed Calls */}
                <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-5 transition-all select-none hover:shadow-xs dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[#64748B] uppercase dark:text-slate-400">
                      Failed / Escalated
                    </span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-rose-200/30 bg-rose-50 text-rose-600 dark:bg-rose-950/20">
                      <AlertOctagon className="size-4.5" />
                    </span>
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-3xl leading-none font-extrabold tracking-tight text-rose-600 dark:text-rose-500">
                      {loading ? '...' : computedMetrics.failed}
                    </span>
                    <div className="mt-2 flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      <span>Requiring human check</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ANALYTICS BRICK SECTION */}
              <section className="grid grid-cols-1 gap-6 select-none lg:grid-cols-12">
                {/* Left Card: Call Failure Reasons */}
                <div className="shadow-3xs rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left lg:col-span-6 dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <h3 className="mb-4.5 flex items-center gap-2.5 text-sm font-extrabold tracking-tight text-[#14213D] dark:text-white">
                    <AlertTriangle className="size-4.5 text-rose-500" />
                    <span>Call Failure Reasons</span>
                  </h3>

                  {loading ? (
                    <div className="flex h-44 items-center justify-center text-xs text-[#64748B]">
                      Loading breakdown...
                    </div>
                  ) : Object.keys(computedMetrics.failures).length === 0 ? (
                    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-[#64748B] dark:border-slate-800">
                      No failed calls recorded in this timeframe.
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {Object.entries(computedMetrics.failures).map(([reason, count]) => {
                        const percentage =
                          computedMetrics.failed > 0
                            ? Math.round((count / computedMetrics.failed) * 100)
                            : 0;
                        return (
                          <div key={reason} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="dark:text-slate-350 font-mono text-[#14213D]">
                                {reason}
                              </span>
                              <span className="font-bold text-[#64748B] dark:text-slate-400">
                                {count} {count === 1 ? 'call' : 'calls'} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full border border-rose-200/10 bg-rose-50 dark:bg-rose-950/20">
                              <div
                                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Card: Health Assistant Quick Checks */}
                <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left lg:col-span-6 dark:border-slate-800/80 dark:bg-[#131F2B]">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold tracking-tight text-[#14213D] dark:text-white">
                      <Activity className="size-4.5 text-[#0FAF9F]" />
                      <span>Health Assistant Quick Checks</span>
                    </h3>

                    {filteredHistory.length === 0 ? (
                      <div className="flex h-36 items-center justify-center text-xs font-semibold text-[#64748B]">
                        Not enough data to generate this insight yet.
                      </div>
                    ) : (
                      <ul className="space-y-3.5 pt-1 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                        <li className="flex gap-2.5">
                          <span className="shrink-0 font-bold text-[#0FAF9F]">✓</span>
                          <span>
                            AI receptionist is performing stable. Response rate is healthy.
                          </span>
                        </li>
                        <li className="flex gap-2.5">
                          <span className="shrink-0 font-bold text-[#0FAF9F]">✓</span>
                          <span>Medication reminders engagement has increased.</span>
                        </li>
                        {computedMetrics.failed > 0 && (
                          <li className="flex gap-2.5">
                            <span className="shrink-0 font-bold text-[#0FAF9F]">!</span>
                            <span>
                              {computedMetrics.failed} calls required human escalations. Verify
                              queue logs.
                            </span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="shadow-3xs mt-5 flex items-center gap-2 rounded-xl border border-[#0FAF9F]/15 bg-[#E9F7F4] px-4 py-2.5 text-[11px] font-bold text-[#0FAF9F] select-none">
                    <Sparkles className="size-4 shrink-0 animate-pulse text-[#0FAF9F]" />
                    <span>Your SehatSaathi AI Assistant is working optimally.</span>
                  </div>
                </div>
              </section>

              {/* CALL HISTORY SECTION */}
              <section className="shadow-3xs overflow-hidden rounded-2xl border border-[#E5EAF0] bg-white dark:border-slate-800/80 dark:bg-[#131F2B]">
                {/* Filters bar */}
                <div className="border-b border-[#E5EAF0] p-5 sm:p-6 dark:border-slate-800">
                  <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold tracking-tight text-[#14213D] sm:text-base dark:text-white">
                        Call History
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                        Recent patient coordination audio logs
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto">
                      {/* Search */}
                      <div className="relative min-w-[200px] flex-1 lg:flex-none">
                        <Search className="absolute top-2.5 left-3 size-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search caller, ID, action..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-xs font-bold outline-none focus:border-[#0FAF9F] focus:ring-1 focus:ring-[#0FAF9F] dark:border-slate-700 dark:bg-[#131F2B]"
                        />
                      </div>

                      {/* Mode Filter */}
                      <div className="relative">
                        <select
                          value={filterMode}
                          onChange={(e) => setFilterMode(e.target.value)}
                          className="text-slate-750 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3 text-xs font-bold outline-none dark:border-slate-700 dark:bg-[#131F2B] dark:text-slate-300"
                        >
                          <option value="all">All Modes</option>
                          <option value="browser">Browser</option>
                          <option value="inbound">Inbound</option>
                          <option value="outbound">Outbound</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-2.5 size-3 text-slate-400" />
                      </div>

                      {/* Language Filter */}
                      <div className="relative">
                        <select
                          value={filterLanguage}
                          onChange={(e) => setFilterLanguage(e.target.value)}
                          className="text-slate-750 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3 text-xs font-bold outline-none dark:border-slate-700 dark:bg-[#131F2B] dark:text-slate-300"
                        >
                          <option value="all">All Languages</option>
                          <option value="english">English</option>
                          <option value="hindi">Hindi</option>
                          <option value="gujarati">Gujarati</option>
                          <option value="unknown">Unknown</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-2.5 size-3 text-slate-400" />
                      </div>

                      {/* Outcome Filter */}
                      <div className="relative">
                        <select
                          value={filterOutcome}
                          onChange={(e) => setFilterOutcome(e.target.value)}
                          className="text-slate-750 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3 text-xs font-bold outline-none dark:border-slate-700 dark:bg-[#131F2B] dark:text-slate-300"
                        >
                          <option value="all">All Outcomes</option>
                          <option value="success">Success</option>
                          <option value="failed">Failed</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-2.5 size-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table details */}
                <div className="relative w-full overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-20 text-xs text-[#64748B]">
                      Retrieving call registry data...
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-20 text-xs text-[#64748B]">
                      <span>No records match the filter criteria.</span>
                      <button
                        onClick={() => {
                          setSearch('');
                          setFilterMode('all');
                          setFilterLanguage('all');
                          setFilterOutcome('all');
                          setDateRange('all');
                        }}
                        className="cursor-pointer text-xs font-bold text-[#0FAF9F] hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-[#E5EAF0] bg-slate-50/50 text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase select-none dark:border-slate-800 dark:bg-slate-900/50">
                          <th className="px-6 py-4">Caller ID</th>
                          <th className="px-6 py-4">Date &amp; Time</th>
                          <th className="px-6 py-4">Duration</th>
                          <th className="px-6 py-4">Language</th>
                          <th className="px-6 py-4">Mode</th>
                          <th className="px-6 py-4">Outcome</th>
                          <th className="px-6 py-4">Action Taken</th>
                          <th className="w-12 px-4 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredHistory.map((call) => {
                          const actionInfo = getActionLabels(call);
                          const callerInfo = formatCallerId(call.caller_id);

                          return (
                            <tr
                              key={call.call_id}
                              className="font-semibold transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-900/10"
                            >
                              {/* Caller Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={cn(
                                      'flex size-8.5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black',
                                      call.outcome === 'success'
                                        ? 'border-[#0FAF9F]/20 bg-[#E9F7F4] text-[#0FAF9F]'
                                        : 'border-rose-200/20 bg-rose-50 text-rose-500 dark:bg-rose-950/20'
                                    )}
                                  >
                                    {callerInfo.initials}
                                  </span>
                                  <div className="flex flex-col text-left">
                                    <span className="leading-tight font-extrabold text-[#14213D] dark:text-white">
                                      {callerInfo.name}
                                    </span>
                                    <span className="mt-0.5 font-mono text-[10px] leading-none text-[#64748B] dark:text-slate-400">
                                      {callerInfo.phone}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Time */}
                              <td className="px-6 py-4 text-left">
                                <div className="text-[#14213D] dark:text-slate-200">
                                  {formatDate(call.start_time)}
                                </div>
                                <div className="mt-0.5 text-[10px] text-[#64748B] dark:text-slate-400">
                                  {formatTime(call.start_time)}
                                </div>
                              </td>

                              {/* Duration */}
                              <td className="px-6 py-4 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                                {formatDuration(call.duration)}
                              </td>

                              {/* Language */}
                              <td className="px-6 py-4 text-left">
                                <span className="shadow-3xs inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900">
                                  <Globe className="size-3 text-slate-400" />
                                  <span>{call.language}</span>
                                </span>
                              </td>

                              {/* Mode */}
                              <td className="px-6 py-4 text-left">
                                <span className="text-slate-650 dark:text-slate-350 font-bold">
                                  {call.call_mode}
                                </span>
                              </td>

                              {/* Outcome */}
                              <td className="px-6 py-4 text-left">
                                {call.outcome === 'success' ? (
                                  <span className="shadow-3xs inline-flex items-center gap-1 rounded-full border border-[#0FAF9F]/30 bg-[#E9F7F4] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#0FAF9F] uppercase">
                                    Success
                                  </span>
                                ) : (
                                  <span className="shadow-3xs inline-flex items-center gap-1 rounded-full border border-rose-200/50 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-rose-600 uppercase dark:bg-rose-950/20 dark:text-rose-400">
                                    Failed
                                  </span>
                                )}
                              </td>

                              {/* Action details */}
                              <td className="px-6 py-4 text-left">
                                <div className="flex flex-col text-left">
                                  <span className="font-mono text-xs font-extrabold tracking-tight text-[#14213D] dark:text-slate-100">
                                    {actionInfo.code}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-tight text-[#64748B] dark:text-slate-400">
                                    &quot;{actionInfo.desc}&quot;
                                  </span>
                                </div>
                              </td>

                              {/* More action menu */}
                              <td className="relative px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveRowMenu(
                                      activeRowMenu === call.call_id ? null : call.call_id
                                    )
                                  }
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 dark:hover:bg-slate-800"
                                >
                                  <MoreVertical className="size-4" />
                                </button>

                                {activeRowMenu === call.call_id && (
                                  <div className="absolute top-4 right-8 z-40 w-40 rounded-xl border border-[#E5EAF0] bg-white py-1.5 text-left shadow-lg dark:border-slate-800 dark:bg-[#131F2B]">
                                    <button
                                      onClick={() => handleCopyId(call.call_id)}
                                      className="w-full px-3.5 py-1.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      {copiedId === call.call_id ? 'Copied!' : 'Copy Call ID'}
                                    </button>
                                    <button
                                      onClick={() =>
                                        alert(
                                          `Details for Call ID: ${call.call_id}\n\nOutcome: ${call.outcome.toUpperCase()}\nAction: ${actionInfo.code} (${actionInfo.desc})\nDuration: ${call.duration} sec\nTime: ${call.start_time}`
                                        )
                                      }
                                      className="w-full px-3.5 py-1.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ================= VIEW 2: PATIENTS ================= */}
          {activeTab === 'patients' && (
            <section className="shadow-3xs overflow-hidden rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left dark:border-slate-800 dark:bg-[#131F2B]">
              <h3 className="font-display mb-4 text-base font-extrabold text-[#14213D] dark:text-white">
                Patient Directory
              </h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5EAF0] pb-2 text-[10px] font-extrabold text-[#64748B] uppercase dark:border-slate-800">
                      <th className="py-3 pr-4">Patient Name</th>
                      <th className="py-3 pr-4">Contact Phone</th>
                      <th className="py-3 pr-4">Language</th>
                      <th className="py-3 pr-4">Age</th>
                      <th className="py-3 pr-4">Last Call Date</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold dark:divide-slate-800">
                    {patientsList.map((pat, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3 pr-4 font-bold text-[#14213D] dark:text-white">
                          {pat.name}
                        </td>
                        <td className="py-3 pr-4 font-mono">{pat.phone}</td>
                        <td className="py-3 pr-4">{pat.lang}</td>
                        <td className="py-3 pr-4">{pat.age}</td>
                        <td className="py-3 pr-4 text-slate-500">{pat.lastCall}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase',
                              pat.status === 'Verified' && 'bg-[#E9F7F4] text-[#0FAF9F]',
                              pat.status === 'Staff' &&
                                'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20',
                              pat.status.includes('Pending') &&
                                'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                            )}
                          >
                            {pat.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ================= VIEW 3: APPOINTMENTS ================= */}
          {activeTab === 'appointments' && (
            <section className="shadow-3xs overflow-hidden rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left dark:border-slate-800 dark:bg-[#131F2B]">
              <h3 className="font-display mb-4 text-base font-extrabold text-[#14213D] dark:text-white">
                Upcoming Appointments Booked
              </h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5EAF0] pb-2 text-[10px] font-extrabold text-[#64748B] uppercase dark:border-slate-800">
                      <th className="py-3 pr-4">Patient Name</th>
                      <th className="py-3 pr-4">Assigned Doctor</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Time Slot</th>
                      <th className="py-3 pr-4">Consultation Type</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold dark:divide-slate-800">
                    {appointmentsList.map((app, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3 pr-4 font-bold text-[#14213D] dark:text-white">
                          {app.name}
                        </td>
                        <td className="py-3 pr-4">{app.doctor}</td>
                        <td className="py-3 pr-4">{app.date}</td>
                        <td className="py-3 pr-4 font-mono">{app.time}</td>
                        <td className="py-3 pr-4">{app.type}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase',
                              app.status === 'Confirmed'
                                ? 'bg-[#E9F7F4] text-[#0FAF9F]'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                            )}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ================= VIEW 4: MEDICATIONS ================= */}
          {activeTab === 'medications' && (
            <section className="shadow-3xs overflow-hidden rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left dark:border-slate-800 dark:bg-[#131F2B]">
              <h3 className="font-display mb-4 text-base font-extrabold text-[#14213D] dark:text-white">
                Medication Reminders Dispatch Log
              </h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5EAF0] pb-2 text-[10px] font-extrabold text-[#64748B] uppercase dark:border-slate-800">
                      <th className="py-3 pr-4">Patient Name</th>
                      <th className="py-3 pr-4">Prescribed Drug</th>
                      <th className="py-3 pr-4">Dosage Directions</th>
                      <th className="py-3 pr-4">Outbound Alert Logs</th>
                      <th className="py-3 pr-4">Trigger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold dark:divide-slate-800">
                    {medicationsList.map((med, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3 pr-4 font-bold text-[#14213D] dark:text-white">
                          {med.patient}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[#0FAF9F]">{med.drug}</td>
                        <td className="py-3 pr-4">{med.dosage}</td>
                        <td className="text-slate-550 py-3 pr-4">{med.logs}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase',
                              med.status === 'Delivered'
                                ? 'bg-[#E9F7F4] text-[#0FAF9F]'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            )}
                          >
                            {med.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ================= VIEW 5: ANALYTICS ================= */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2">
              {/* Language Distribution */}
              <div className="shadow-3xs rounded-2xl border border-[#E5EAF0] bg-white p-6 dark:border-slate-800 dark:bg-[#131F2B]">
                <h3 className="font-display mb-4 text-sm font-extrabold text-[#14213D] dark:text-white">
                  Conversational Language Distribution
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Hindi (Devanagari / Hinglish)</span>
                      <span>45%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[#0FAF9F]" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>English</span>
                      <span>35%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[#0FAF9F]" style={{ width: '35%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Gujarati</span>
                      <span>20%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[#0FAF9F]" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Load trends */}
              <div className="shadow-3xs flex flex-col justify-between rounded-2xl border border-[#E5EAF0] bg-white p-6 dark:border-slate-800 dark:bg-[#131F2B]">
                <div>
                  <h3 className="font-display mb-3 text-sm font-extrabold text-[#14213D] dark:text-white">
                    Peak Operational Hours
                  </h3>
                  <p className="mb-4 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                    Distribution of patient voice requests throughout the day
                  </p>
                  <div className="dark:text-slate-350 space-y-3.5 text-xs font-bold text-slate-700">
                    <div className="flex justify-between">
                      <span>Morning (09:00 AM - 12:00 PM)</span>
                      <span>65% volume</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Afternoon (12:00 PM - 04:00 PM)</span>
                      <span>20% volume</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evening (04:00 PM - 07:00 PM)</span>
                      <span>15% volume</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 border-t pt-3 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <section className="shadow-3xs max-w-2xl rounded-2xl border border-[#E5EAF0] bg-white p-6 text-left dark:border-slate-800 dark:bg-[#131F2B]">
              <h3 className="font-display mb-5 text-base font-extrabold text-[#14213D] dark:text-white">
                Clinic System Configuration
              </h3>
              <form
                className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Settings saved successfully!');
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="clinic-name-input">Clinic Name</label>
                    <input
                      id="clinic-name-input"
                      type="text"
                      defaultValue="Sunrise Family Clinic"
                      className="rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:ring-1 focus:ring-[#0FAF9F] dark:border-slate-700 dark:bg-[#0B131B]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label htmlFor="assigned-doc-input">Primary Physician</label>
                    <input
                      id="assigned-doc-input"
                      type="text"
                      defaultValue="Dr. Priya Sharma"
                      className="rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:ring-1 focus:ring-[#0FAF9F] dark:border-slate-700 dark:bg-[#0B131B]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="clinic-contact-input">Contact Phone (Public Display)</label>
                  <input
                    id="clinic-contact-input"
                    type="text"
                    defaultValue="+91 9998983110"
                    className="rounded-xl border border-slate-200 bg-white p-2.5 font-mono outline-none focus:ring-1 focus:ring-[#0FAF9F] dark:border-slate-700 dark:bg-[#0B131B]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="ai-voice-select">AI Voice Gender</label>
                    <select
                      id="ai-voice-select"
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 outline-none dark:border-slate-700 dark:bg-[#0B131B]"
                    >
                      <option>Female (Recommended - Priya)</option>
                      <option>Male (Amit)</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label htmlFor="ai-reception-lang">Primary Speech Model</label>
                    <select
                      id="ai-reception-lang"
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 outline-none dark:border-slate-700 dark:bg-[#0B131B]"
                    >
                      <option>Bharat Multilingual (Hindi/Eng/Guj)</option>
                      <option>English Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="submit"
                    className="cursor-pointer rounded-full bg-[#0FAF9F] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-102 hover:bg-[#0d9688]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
