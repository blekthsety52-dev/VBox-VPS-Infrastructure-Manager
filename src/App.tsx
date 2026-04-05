import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  ShieldCheck, 
  Database, 
  Activity, 
  Terminal, 
  Settings, 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  RefreshCw,
  Cpu,
  HardDrive,
  Network,
  Lock,
  History,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { VM, DashboardData } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    )}
  >
    <Icon size={20} className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, unit, icon: Icon, color }: { label: string, value: number, unit: string, icon: any, color: string }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-right">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}{unit}</h3>
      </div>
    </div>
    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={cn("h-full rounded-full", color.replace('bg-', 'bg-opacity-80 bg-'))}
      />
    </div>
  </div>
);

const VMCard = ({ vm, onStart, onStop, onDelete }: { vm: VM, onStart: (id: string) => void, onStop: (id: string) => void, onDelete: (id: string) => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors group"
  >
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            vm.status === 'running' ? "bg-emerald-500/10 text-emerald-500" : 
            vm.status === 'stopped' ? "bg-slate-500/10 text-slate-500" : "bg-amber-500/10 text-amber-500"
          )}>
            <Server size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{vm.name}</h4>
            <p className="text-xs text-slate-500 font-mono">{vm.ip}</p>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          vm.status === 'running' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
          vm.status === 'stopped' ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" : 
          "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
        )}>
          {vm.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Cpu size={12} />
            <span>CPU Usage</span>
          </div>
          <p className="text-white font-bold">{vm.cpu}%</p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity size={12} />
            <span>Memory</span>
          </div>
          <p className="text-white font-bold">{vm.ram}MB</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Clock size={12} />
          <span>Uptime: {vm.uptime}</span>
        </div>
        <div className="flex items-center gap-2">
          {vm.status === 'stopped' ? (
            <button onClick={() => onStart(vm.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Start">
              <Play size={18} fill="currentColor" />
            </button>
          ) : (
            <button onClick={() => onStop(vm.id)} className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Stop">
              <Square size={18} fill="currentColor" />
            </button>
          )}
          <button onClick={() => onDelete(vm.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vms, setVms] = useState<VM[]>([]);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newVmName, setNewVmName] = useState('');

  const fetchData = async () => {
    try {
      const [vpsRes, statsRes] = await Promise.all([
        fetch('/api/vps'),
        fetch('/api/stats')
      ]);
      const vpsData = await vpsRes.json();
      const statsData = await statsRes.json();
      setVms(vpsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateVm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      await fetch('/api/vps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVmName, template: 'ubuntu-22.04', cpu: 4, ram: 8192 })
      });
      setNewVmName('');
      fetchData();
    } catch (err) {
      console.error("Failed to create VM", err);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleAction = async (id: string, action: 'start' | 'stop' | 'delete') => {
    try {
      if (action === 'delete') {
        await fetch(`/api/vps/${id}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/vps/${id}/${action}`, { method: 'POST' });
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to ${action} VM`, err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium animate-pulse">Initializing Infrastructure Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-8 bg-slate-950/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white">VBOX<span className="text-blue-500">OPS</span></h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Server} label="Instances" active={activeTab === 'instances'} onClick={() => setActiveTab('instances')} />
          <SidebarItem icon={Activity} label="Monitoring" active={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')} />
          <SidebarItem icon={ShieldCheck} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <SidebarItem icon={Database} label="Backups" active={activeTab === 'backups'} onClick={() => setActiveTab('backups')} />
          <SidebarItem icon={Terminal} label="API Docs" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
        </nav>

        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">All systems operational. Host uptime: 42d 18h.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white capitalize">{activeTab}</h2>
            <p className="text-slate-400 mt-1">Manage and monitor your VirtualBox VPS infrastructure.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Activity size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950" />
            </button>
            <div className="h-8 w-[1px] bg-slate-800 mx-2" />
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">A</div>
              <span className="text-sm font-medium text-slate-200">Admin</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Host CPU Load" value={stats?.host.cpuLoad || 0} unit="%" icon={Cpu} color="bg-blue-600" />
                <StatCard label="RAM Usage" value={stats?.host.ramUsage || 0} unit="%" icon={Activity} color="bg-indigo-600" />
                <StatCard label="Disk Usage" value={stats?.host.diskUsage || 0} unit="%" icon={HardDrive} color="bg-violet-600" />
                <StatCard label="Active VPS" value={vms.filter(v => v.status === 'running').length} unit="" icon={Server} color="bg-emerald-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity size={20} className="text-blue-500" />
                      Infrastructure Throughput
                    </h3>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" /> Inbound
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" /> Outbound
                      </span>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { time: '10:00', in: 45, out: 32 },
                        { time: '10:05', in: 52, out: 38 },
                        { time: '10:10', in: 48, out: 42 },
                        { time: '10:15', in: 61, out: 45 },
                        { time: '10:20', in: 55, out: 40 },
                        { time: '10:25', in: 67, out: 48 },
                        { time: '10:30', in: 72, out: 55 },
                      ]}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#f1f5f9' }}
                        />
                        <Area type="monotone" dataKey="in" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                        <Area type="monotone" dataKey="out" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Provisioning */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-blue-500" />
                    Quick Deploy
                  </h3>
                  <form onSubmit={handleCreateVm} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Instance Name</label>
                      <input 
                        type="text" 
                        value={newVmName}
                        onChange={(e) => setNewVmName(e.target.value)}
                        placeholder="e.g. app-worker-01"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Base Template</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                        <option>Ubuntu 22.04 LTS</option>
                        <option>Debian 12</option>
                        <option>CentOS Stream 9</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">vCPU</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                          <option>2 Cores</option>
                          <option>4 Cores</option>
                          <option>8 Cores</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">RAM</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                          <option>2048 MB</option>
                          <option>4096 MB</option>
                          <option>8192 MB</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isProvisioning}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProvisioning ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                      Deploy Instance
                    </button>
                  </form>
                </div>
              </div>

              {/* Recent Instances */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Active Instances</h3>
                  <button onClick={() => setActiveTab('instances')} className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vms.slice(0, 3).map(vm => (
                    <VMCard 
                      key={vm.id} 
                      vm={vm} 
                      onStart={(id) => handleAction(id, 'start')} 
                      onStop={(id) => handleAction(id, 'stop')} 
                      onDelete={(id) => handleAction(id, 'delete')} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'instances' && (
            <motion.div 
              key="instances"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search instances..." 
                      className="bg-slate-900 border border-slate-800 rounded-xl px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  </div>
                  <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Status</option>
                    <option>Running</option>
                    <option>Stopped</option>
                  </select>
                </div>
                <button onClick={() => setIsProvisioning(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus size={18} /> New Instance
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vms.map(vm => (
                  <VMCard 
                    key={vm.id} 
                    vm={vm} 
                    onStart={(id) => handleAction(id, 'start')} 
                    onStop={(id) => handleAction(id, 'stop')} 
                    onDelete={(id) => handleAction(id, 'delete')} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Lock size={24} className="text-blue-500" />
                    SSH Hardening
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div>
                        <p className="font-bold text-white">Password Authentication</p>
                        <p className="text-xs text-slate-400">Disable password-based logins for all VPS.</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div>
                        <p className="font-bold text-white">Root Login</p>
                        <p className="text-xs text-slate-400">Prevent direct root access via SSH.</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Global Authorized Keys</label>
                      <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD..."
                        defaultValue="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDA7p9X..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    UFW Firewall Rules
                  </h3>
                  <div className="space-y-4">
                    {[
                      { port: 22, proto: 'TCP', label: 'SSH', status: 'Allow' },
                      { port: 80, proto: 'TCP', label: 'HTTP', status: 'Allow' },
                      { port: 443, proto: 'TCP', label: 'HTTPS', status: 'Allow' },
                      { port: 8080, proto: 'TCP', label: 'API', status: 'Allow' },
                    ].map(rule => (
                      <div key={rule.port} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-blue-400">{rule.port}</div>
                          <div>
                            <p className="font-bold text-white">{rule.label}</p>
                            <p className="text-xs text-slate-500">{rule.proto}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">{rule.status}</span>
                      </div>
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all text-sm font-medium">
                      + Add Custom Rule
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <AlertCircle size={24} className="text-amber-500" />
                    Fail2Ban Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Active Jails</span>
                      <span className="text-white font-bold">4</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">SSH Jail</span>
                        <span className="text-emerald-400">Active</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Nginx Auth Jail</span>
                        <span className="text-emerald-400">Active</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <div className="flex gap-3">
                        <ShieldCheck className="text-amber-500 shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-bold text-amber-500">12 IPs Banned</p>
                          <p className="text-xs text-amber-500/70">In the last 24 hours. Most frequent: 185.22.14.x</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <RefreshCw size={24} className="text-blue-500" />
                    Unattended Upgrades
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Automatic Security Updates</span>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Automatic Reboot</span>
                      <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notification Email</p>
                      <p className="text-sm text-white font-medium">ops@example.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'backups' && (
            <motion.div 
              key="backups"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">Backup History</h3>
                      <button className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">Download All Logs</button>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {[
                        { date: '2026-04-05', time: '02:00', type: 'Incremental', size: '1.2 GB', status: 'Success' },
                        { date: '2026-04-04', time: '02:00', type: 'Incremental', size: '1.1 GB', status: 'Success' },
                        { date: '2026-04-03', time: '02:00', type: 'Incremental', size: '1.4 GB', status: 'Success' },
                        { date: '2026-03-30', time: '03:00', type: 'Full', size: '124.5 GB', status: 'Success' },
                        { date: '2026-03-29', time: '02:00', type: 'Incremental', size: '0.9 GB', status: 'Success' },
                      ].map((backup, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                              <History size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-white">{backup.date} <span className="text-slate-500 font-normal ml-2">{backup.time}</span></p>
                              <p className="text-xs text-slate-500">{backup.type} Backup</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{backup.size}</p>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{backup.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Settings size={24} className="text-blue-500" />
                      Backup Strategy
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incremental Backups</p>
                        <p className="text-sm text-white font-medium">Daily at 02:00 AM</p>
                        <p className="text-xs text-slate-500">Retention: 7 days</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Backups</p>
                        <p className="text-sm text-white font-medium">Weekly (Sundays) at 03:00 AM</p>
                        <p className="text-xs text-slate-500">Retention: 4 weeks</p>
                      </div>
                      <div className="pt-4 border-t border-slate-800">
                        <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <RefreshCw size={18} /> Run Manual Backup
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      Restore Verification
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-sm font-bold text-emerald-500">Last Test: Successful</p>
                        <p className="text-xs text-emerald-500/70">Verified on 2026-04-01 04:30 AM</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Automated restore tests are performed weekly on a dedicated test VM to ensure data integrity and recoverability.
                      </p>
                      <button className="w-full border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-all text-sm">
                        View Restore Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div 
              key="api"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full border border-blue-500/20">v1.0.0</span>
                  <h3 className="text-2xl font-bold text-white">Infrastructure API</h3>
                </div>
                <p className="text-slate-400">Automate your infrastructure with our RESTful API. All endpoints require JWT authentication.</p>
              </div>
              <div className="p-8 space-y-10">
                {[
                  { method: 'GET', path: '/vps', desc: 'List all VPS instances.', response: '[ { "id": "...", "name": "...", ... } ]' },
                  { method: 'POST', path: '/vps', desc: 'Create a new VPS instance.', body: '{ "name": "string", "template": "string", ... }' },
                  { method: 'POST', path: '/vps/{id}/start', desc: 'Start a stopped VPS instance.', response: '{ "status": "started", ... }' },
                  { method: 'DELETE', path: '/vps/{id}', desc: 'Destroy a VPS instance and its storage.', response: '{ "status": "destroyed", ... }' },
                ].map((endpoint, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-black",
                        endpoint.method === 'GET' ? "bg-emerald-500/10 text-emerald-500" :
                        endpoint.method === 'POST' ? "bg-blue-500/10 text-blue-500" :
                        "bg-rose-500/10 text-rose-500"
                      )}>{endpoint.method}</span>
                      <code className="text-white font-mono font-bold">{endpoint.path}</code>
                    </div>
                    <p className="text-sm text-slate-400">{endpoint.desc}</p>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300">
                      <p className="text-slate-500 mb-2">// {endpoint.body ? 'Request Body' : 'Response Example'}</p>
                      <pre>{endpoint.body || endpoint.response}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
