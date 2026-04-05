export interface VM {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'provisioning' | 'error';
  ip: string;
  cpu: number;
  ram: number;
  uptime: string;
}

export interface HostStats {
  cpuLoad: number;
  ramUsage: number;
  diskUsage: number;
  networkTraffic: {
    in: number;
    out: number;
  };
}

export interface DashboardData {
  host: HostStats;
  vms: { name: string; cpu: number; ram: number }[];
}
