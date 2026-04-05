import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Data Store
  let vms = [
    { id: "1", name: "web-server-01", status: "running", ip: "192.168.1.10", cpu: 12, ram: 2048, uptime: "5d 12h" },
    { id: "2", name: "db-master", status: "running", ip: "192.168.1.11", cpu: 45, ram: 4096, uptime: "12d 4h" },
    { id: "3", name: "redis-cache", status: "stopped", ip: "192.168.1.12", cpu: 0, ram: 1024, uptime: "0s" },
  ];

  // API Routes (Section 8.4)
  app.get("/api/vps", (req, res) => {
    res.json(vms);
  });

  app.post("/api/vps", (req, res) => {
    const { name, template, cpu, ram } = req.body;
    const newVm = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `vps-${vms.length + 1}`,
      status: "provisioning",
      ip: `192.168.1.${100 + vms.length}`,
      cpu: 0,
      ram: parseInt(ram) || 2048,
      uptime: "0s"
    };
    vms.push(newVm);
    
    // Simulate provisioning
    setTimeout(() => {
      const vm = vms.find(v => v.id === newVm.id);
      if (vm) vm.status = "running";
    }, 5000);

    res.json({ status: "created", vm: newVm });
  });

  app.post("/api/vps/:id/start", (req, res) => {
    const vm = vms.find(v => v.id === req.params.id);
    if (vm) {
      vm.status = "running";
      res.json({ status: "started", name: vm.name });
    } else {
      res.status(404).json({ error: "VM not found" });
    }
  });

  app.post("/api/vps/:id/stop", (req, res) => {
    const vm = vms.find(v => v.id === req.params.id);
    if (vm) {
      vm.status = "stopped";
      vm.cpu = 0;
      res.json({ status: "stopping", name: vm.name });
    } else {
      res.status(404).json({ error: "VM not found" });
    }
  });

  app.delete("/api/vps/:id", (req, res) => {
    const index = vms.findIndex(v => v.id === req.params.id);
    if (index !== -1) {
      const name = vms[index].name;
      vms.splice(index, 1);
      res.json({ status: "destroyed", name });
    } else {
      res.status(404).json({ error: "VM not found" });
    }
  });

  app.get("/api/stats", (req, res) => {
    res.json({
      host: {
        cpuLoad: 24,
        ramUsage: 45,
        diskUsage: 32,
        networkTraffic: { in: 120, out: 85 }
      },
      vms: vms.map(v => ({
        name: v.name,
        cpu: v.status === 'running' ? Math.floor(Math.random() * 60) + 10 : 0,
        ram: v.status === 'running' ? Math.floor(Math.random() * 80) + 20 : 0
      }))
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
