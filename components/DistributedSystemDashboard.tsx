import React, { useState, useEffect } from 'react';
import { ProjectType } from '../types';
import { 
  Network, Server, Cpu, Database, Activity, Shield, RefreshCw, Zap,
  CheckCircle, AlertTriangle, ArrowRight, Layers, Copy, Check, Terminal,
  Radio, Globe, Shuffle, Plus, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DistributedSystemDashboardProps {
  projectType: ProjectType;
}

interface ServiceNode {
  id: string;
  name: string;
  role: string;
  type: 'gateway' | 'app' | 'worker' | 'cache' | 'db' | 'eventbus';
  status: 'healthy' | 'warning' | 'recovering';
  latency: number;
  cpu: number;
  memory: number;
  replicas: number;
  ip: string;
}

export const DistributedSystemDashboard: React.FC<DistributedSystemDashboardProps> = ({ projectType }) => {
  const [subTab, setSubTab] = useState<'topology' | 'events' | 'manifests'>('topology');
  const [trafficLoad, setTrafficLoad] = useState<'normal' | 'high' | 'surge'>('normal');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [isSimulatingFailover, setIsSimulatingFailover] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedManifest, setSelectedManifest] = useState<'docker' | 'k8s' | 'circuit' | 'topology'>('docker');
  
  // Dynamic nodes state
  const [nodes, setNodes] = useState<ServiceNode[]>([
    {
      id: 'node-gateway',
      name: 'Edge API Gateway',
      role: 'Anycast Reverse Proxy & Rate Limiter (Envoy/Kong)',
      type: 'gateway',
      status: 'healthy',
      latency: 4,
      cpu: 18,
      memory: 128,
      replicas: 2,
      ip: '10.0.0.1'
    },
    {
      id: 'node-app',
      name: 'App Service Pods',
      role: `${projectType === 'store' ? 'Next.js E-Commerce' : projectType === 'blog' ? 'Next.js SSR Blog' : 'AI Travel Service'} Stateless Nodes`,
      type: 'app',
      status: 'healthy',
      latency: 14,
      cpu: 32,
      memory: 512,
      replicas: 3,
      ip: '10.0.1.10-12'
    },
    {
      id: 'node-cache',
      name: 'Distributed Redis Mesh',
      role: 'In-Memory Shared Session & Catalog Tier (Cluster)',
      type: 'cache',
      status: 'healthy',
      latency: 1.2,
      cpu: 12,
      memory: 1024,
      replicas: 3,
      ip: '10.0.2.1-3'
    },
    {
      id: 'node-worker',
      name: 'Async AI Worker Node',
      role: 'Queue Consumer (Image Synthesis & Vector Embeddings)',
      type: 'worker',
      status: 'healthy',
      latency: 48,
      cpu: 45,
      memory: 768,
      replicas: 2,
      ip: '10.0.3.5-6'
    },
    {
      id: 'node-eventbus',
      name: 'Event Bus (Redpanda/Kafka)',
      role: 'Distributed Log & Pub/Sub Event Streamer',
      type: 'eventbus',
      status: 'healthy',
      latency: 2.5,
      cpu: 22,
      memory: 512,
      replicas: 3,
      ip: '10.0.4.1-3'
    },
    {
      id: 'node-db',
      name: 'Primary Database & Replicas',
      role: 'Convex / PostgreSQL Sharded Cluster with WAL Sync',
      type: 'db',
      status: 'healthy',
      latency: 8.5,
      cpu: 28,
      memory: 2048,
      replicas: 2,
      ip: '10.0.5.10'
    }
  ]);

  // Real-time metrics
  const [qps, setQps] = useState(1420);
  const [dropRate, setDropRate] = useState(0.00);
  const [avgLatency, setAvgLatency] = useState(12.4);

  // Event stream simulator
  const [eventLogs, setEventLogs] = useState<{ id: string; topic: string; payload: string; time: string }[]>([
    { id: '1', topic: 'telemetry.heartbeat', payload: '{"node": "gateway-01", "status": "UP", "load": 0.18}', time: 'Agora' },
    { id: '2', topic: `${projectType}.catalog.synced`, payload: '{"version": "v3.2", "items_count": 24, "cache_ttl": 3600}', time: '-2s' },
    { id: '3', topic: 'ai.generation.completed', payload: '{"task_id": "gen_88a", "worker": "worker-02", "duration_ms": 412}', time: '-5s' },
    { id: '4', topic: 'auth.session.validated', payload: '{"provider": "clerk_jwt", "tenant": "default", "scope": "read_write"}', time: '-11s' }
  ]);

  // Simulate Traffic Load Action
  const handleSimulateTraffic = (tier: 'normal' | 'high' | 'surge') => {
    setTrafficLoad(tier);
    setIsSimulatingTraffic(true);

    if (tier === 'surge') {
      setQps(14850);
      setAvgLatency(18.2);
      setNodes(prev => prev.map(n => ({
        ...n,
        cpu: Math.min(88, n.cpu * 2.2),
        latency: Number((n.latency * 1.5).toFixed(1))
      })));
    } else if (tier === 'high') {
      setQps(6200);
      setAvgLatency(14.1);
      setNodes(prev => prev.map(n => ({
        ...n,
        cpu: Math.min(65, n.cpu * 1.6),
        latency: Number((n.latency * 1.2).toFixed(1))
      })));
    } else {
      setQps(1420);
      setAvgLatency(12.4);
      setNodes(prev => prev.map(n => ({
        ...n,
        cpu: Math.max(15, Math.floor(n.cpu * 0.6)),
        latency: Number((n.latency * 0.8).toFixed(1))
      })));
    }

    setTimeout(() => {
      setIsSimulatingTraffic(false);
    }, 1200);
  };

  // Simulate Self-Healing Node Failover Action
  const handleSimulateFailover = () => {
    setIsSimulatingFailover(true);
    
    // Temporarily degrade App Node
    setNodes(prev => prev.map(n => n.id === 'node-app' ? { ...n, status: 'recovering', latency: 38 } : n));
    setDropRate(0.04);

    // After 1.5s, Gateway reroutes to healthy replica and self-heals
    setTimeout(() => {
      setNodes(prev => prev.map(n => n.id === 'node-app' ? { ...n, status: 'healthy', latency: 15, replicas: n.replicas + 1 } : n));
      setDropRate(0.00);
      setIsSimulatingFailover(false);

      // Add event log
      setEventLogs(prev => [
        { 
          id: String(Date.now()), 
          topic: 'cluster.failover.self_healed', 
          payload: '{"degraded_pod": "app-pod-02", "action": "auto_evicted", "healthy_spawned": "app-pod-04", "downtime": "0ms"}', 
          time: 'Agora' 
        },
        ...prev.slice(0, 5)
      ]);
    }, 2000);
  };

  // Pod scale adjustment
  const handleAdjustReplicas = (nodeId: string, delta: number) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const next = Math.max(1, Math.min(12, n.replicas + delta));
        return { ...n, replicas: next };
      }
      return n;
    }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Docker Compose Distributed
  const dockerComposeCode = `version: '3.8'

services:
  # 1. Edge API Gateway & Load Balancer
  gateway:
    image: traefik:v3.0
    container_name: distributed-gateway
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080" # Dashboard
    depends_on:
      - app-service
      - redis-cache

  # 2. Stateless Application Cluster (Scalable)
  app-service:
    build:
      context: .
      dockerfile: Dockerfile
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.75'
          memory: 512M
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cache:6379
      - EVENT_BUS_BROKER=eventbus:9092
      - DATABASE_URL=postgresql://postgres:secret@db-cluster:5432/${projectType}_db
    depends_on:
      - redis-cache
      - eventbus

  # 3. Distributed Redis In-Memory Mesh
  redis-cache:
    image: redis:7-alpine
    container_name: distributed-redis
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # 4. Asynchronous Event Broker
  eventbus:
    image: vectorized/redpanda:latest
    container_name: distributed-eventbus
    command:
      - redpanda start
      - --smp 1
      - --memory 512M
      - --overprovisioned
    ports:
      - "9092:9092"

  # 5. Background AI & Heavy Task Worker
  worker-service:
    build:
      context: .
      dockerfile: Dockerfile.worker
    deploy:
      replicas: 2
    environment:
      - BROKER_URL=eventbus:9092
      - CONCURRENCY=10
    depends_on:
      - eventbus

volumes:
  redis-data:
`;

  // Kubernetes Manifests
  const k8sManifestCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectType}-stateless-app
  labels:
    app: ${projectType}-app
    tier: distributed-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${projectType}-app
  template:
    metadata:
      labels:
        app: ${projectType}-app
    spec:
      containers:
      - name: web
        image: ghcr.io/org/${projectType}-app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-distributed-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "750m"
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${projectType}-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${projectType}-stateless-app
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
---
apiVersion: v1
kind: Service
metadata:
  name: ${projectType}-app-service
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: ${projectType}-app
`;

  // Circuit Breaker & Distributed Resilience Helper
  const circuitBreakerCode = `/**
 * @file Distributed Circuit Breaker & Resilient Dispatcher
 * Protege chamadas entre microserviços e nós remotos com auto-cura e timeout adaptativo.
 */

export interface CircuitOptions {
  failureThreshold?: number;
  recoveryTimeMs?: number;
  timeoutMs?: number;
}

export class DistributedCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private nextAttempt = Date.now();

  constructor(private name: string, private options: CircuitOptions = {}) {
    this.options.failureThreshold = options.failureThreshold || 3;
    this.options.recoveryTimeMs = options.recoveryTimeMs || 5000;
    this.options.timeoutMs = options.timeoutMs || 3000;
  }

  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        console.warn(\`[Circuit:\${this.name}] Circuito aberto. Disparando Fallback imediato.\`);
        return fallback();
      }
    }

    try {
      const result = await Promise.race([
        action(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Distributed timeout exceeded')), this.options.timeoutMs)
        )
      ]);

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= (this.options.failureThreshold || 3)) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + (this.options.recoveryTimeMs || 5000);
      }
      return fallback();
    }
  }
}
`;

  // Topology JSON
  const topologyJsonCode = JSON.stringify({
    architecture: "Distributed Microservices & Service Mesh",
    version: "3.2.0-distributed",
    cluster_nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      role: n.role,
      type: n.type,
      replicas: n.replicas,
      health_status: n.status,
      assigned_ip_range: n.ip
    })),
    network: {
      load_balancer: "Envoy / Traefik Anycast Edge",
      session_affinity: "Client-IP with Redis Distributed Shared Session",
      mesh_mtls: "Enabled (Zero-Trust mTLS between Pods)",
      event_bus: "Redpanda / Apache Kafka with Exactly-Once Semantics"
    }
  }, null, 2);

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans text-gray-200">
      {/* Top Banner introducing Distributed Architecture */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-cyan-950/40 border border-cyan-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              <Network className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-base md:text-lg font-bold text-gray-100">
              Arquitetura de Sistema Distribuído & Service Mesh
            </h2>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Este projeto foi estruturado para operar como um conjunto desacoplado de microserviços, workers em fila assíncrona e réplicas de leitura resilientes. Não há pontos únicos de falha (Single Point of Failure).
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-gray-950 p-1.5 rounded-xl border border-gray-800 text-[11px] font-bold self-stretch md:self-auto gap-1">
          <button
            onClick={() => setSubTab('topology')}
            className={`px-3.5 py-1.5 rounded-lg transition uppercase cursor-pointer flex items-center gap-1.5 ${
              subTab === 'topology' ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Nós & Topologia
          </button>
          <button
            onClick={() => setSubTab('events')}
            className={`px-3.5 py-1.5 rounded-lg transition uppercase cursor-pointer flex items-center gap-1.5 ${
              subTab === 'events' ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Event Bus (Pub/Sub)
          </button>
          <button
            onClick={() => setSubTab('manifests')}
            className={`px-3.5 py-1.5 rounded-lg transition uppercase cursor-pointer flex items-center gap-1.5 ${
              subTab === 'manifests' ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Docker & K8s
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Throughput Global</span>
            <span className="text-base font-black text-cyan-400 font-mono">{qps.toLocaleString()} <span className="text-[10px] text-gray-400">req/s</span></span>
          </div>
          <Activity className="w-5 h-5 text-cyan-500/40" />
        </div>

        <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Latência p99</span>
            <span className="text-base font-black text-emerald-400 font-mono">{avgLatency} <span className="text-[10px] text-gray-400">ms</span></span>
          </div>
          <Zap className="w-5 h-5 text-emerald-500/40" />
        </div>

        <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Taxa de Perda</span>
            <span className="text-base font-black text-green-400 font-mono">{dropRate.toFixed(2)}%</span>
          </div>
          <Shield className="w-5 h-5 text-green-500/40" />
        </div>

        <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Nós em Mesh</span>
            <span className="text-base font-black text-gray-200 font-mono">
              {nodes.reduce((acc, n) => acc + n.replicas, 0)} <span className="text-[10px] text-gray-500">instâncias</span>
            </span>
          </div>
          <Cpu className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* TAB 1: TOPOLOGY & NODES */}
      {subTab === 'topology' && (
        <div className="space-y-5 animate-fade-in">
          {/* Interactive Control Ribbon */}
          <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-gray-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Simulador Interativo de Auto-Cura e Balanceamento de Carga
              </h4>
              <p className="text-[11px] text-gray-400">
                Experimente o comportamento do sistema sob alta concorrência ou simule a queda de um pod para comprovar a resiliência distribuída.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 text-[10px] font-bold">
                <button
                  onClick={() => handleSimulateTraffic('normal')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${trafficLoad === 'normal' ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400'}`}
                >
                  Normal (1.4k)
                </button>
                <button
                  onClick={() => handleSimulateTraffic('high')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${trafficLoad === 'high' ? 'bg-yellow-500 text-black font-extrabold' : 'text-gray-400'}`}
                >
                  Pico (6.2k)
                </button>
                <button
                  onClick={() => handleSimulateTraffic('surge')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${trafficLoad === 'surge' ? 'bg-red-500 text-white font-extrabold' : 'text-gray-400'}`}
                >
                  Surge (15k)
                </button>
              </div>

              <button
                onClick={handleSimulateFailover}
                disabled={isSimulatingFailover}
                className="bg-gray-800 hover:bg-gray-750 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isSimulatingFailover ? 'animate-spin' : ''}`} />
                {isSimulatingFailover ? 'Executando Failover...' : 'Testar Auto-Failover'}
              </button>
            </div>
          </div>

          {/* Interactive Topology Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                layout
                className={`bg-gray-950 rounded-xl border p-4 flex flex-col justify-between transition duration-300 ${
                  node.status === 'recovering' 
                    ? 'border-yellow-500/60 shadow-lg shadow-yellow-500/10' 
                    : 'border-gray-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        node.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400 animate-ping'
                      }`} />
                      <h4 className="font-bold text-gray-100 text-xs font-mono">{node.name}</h4>
                    </div>

                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      node.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {node.status === 'healthy' ? 'Ativo & Saudável' : 'Auto-Cura'}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-gray-400 leading-snug">
                    {node.role}
                  </p>

                  {/* Node Metrics Progress */}
                  <div className="space-y-2 pt-1 border-t border-gray-900 text-[10px]">
                    <div>
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>Uso de CPU</span>
                        <span className="font-mono font-bold text-gray-200">{node.cpu.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            node.cpu > 75 ? 'bg-red-500' : node.cpu > 50 ? 'bg-yellow-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${node.cpu}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-gray-400 font-mono text-[10px] pt-1">
                      <span>Latência: <strong className="text-cyan-400 font-bold">{node.latency}ms</strong></span>
                      <span>RAM: <strong className="text-gray-300 font-bold">{node.memory}MB</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Replicas & Scaling */}
                <div className="mt-4 pt-3 border-t border-gray-900/80 flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 font-mono">{node.ip}</span>
                  
                  <div className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded-lg border border-gray-800">
                    <span className="text-gray-400 font-bold text-[9.5px]">Pods:</span>
                    <button
                      onClick={() => handleAdjustReplicas(node.id, -1)}
                      className="text-gray-400 hover:text-white p-0.5 hover:bg-gray-800 rounded transition cursor-pointer"
                      title="Reduzir pod"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-black text-cyan-400 text-[10px] px-1">{node.replicas}</span>
                    <button
                      onClick={() => handleAdjustReplicas(node.id, 1)}
                      className="text-gray-400 hover:text-white p-0.5 hover:bg-gray-800 rounded transition cursor-pointer"
                      title="Adicionar pod"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EVENT BUS & PUB/SUB */}
      {subTab === 'events' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Stream de Mensageria Distribuída (Apache Kafka / Redpanda / Redis Streams)
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                Comunicação assíncrona desacoplada entre microserviços. Toda mutação de dados dispara eventos com entrega garantida (At-Least-Once / Exactly-Once).
              </p>
            </div>

            <button
              onClick={() => {
                const sampleTopics = [
                  { topic: `${projectType}.checkout.completed`, payload: '{"order_id": "ord_99", "amount": 149.90, "gateway": "stripe"}' },
                  { topic: 'ai.prompt.synthesize', payload: '{"model": "gemini-3.5-flash", "batch": 4, "tokens": 890}' },
                  { topic: 'cache.warmup.requested', payload: '{"regions": ["gru1", "iad1", "fra1"], "priority": "high"}' }
                ];
                const rand = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
                setEventLogs(prev => [{ id: String(Date.now()), ...rand, time: 'Agora' }, ...prev.slice(0, 7)]);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            >
              <Zap className="w-3.5 h-3.5" /> Disparar Evento Teste
            </button>
          </div>

          {/* Event Stream Log Visualizer */}
          <div className="bg-gray-950 border border-gray-850 rounded-xl overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>TÓPICO & PAYLOAD EM TEMPO REAL</span>
              <span>BUFFER ATIVO: 100% OK</span>
            </div>

            <div className="p-3 space-y-2 font-mono text-[11px] max-h-96 overflow-y-auto custom-scrollbar">
              {eventLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-gray-900/60 hover:bg-gray-900 border border-gray-850 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-cyan-400 font-bold">{log.topic}</span>
                  </div>
                  <div className="text-gray-300 text-[10px] truncate max-w-md bg-gray-950/80 px-2 py-0.5 rounded border border-gray-800/80">
                    <code>{log.payload}</code>
                  </div>
                  <span className="text-gray-500 text-[9px] flex-shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCKER & KUBERNETES MANIFESTS */}
      {subTab === 'manifests' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-xs font-bold text-gray-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Arquivos de Orquestração & Deploy Distribuído
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                Estes manifestos já estão incluídos no pacote exportável (.zip e GitHub) para você inicializar seu cluster com um único comando.
              </p>
            </div>

            {/* Sub-selector for code snippets */}
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 text-[10px] font-bold gap-1">
              {[
                { id: 'docker', label: 'docker-compose.yml' },
                { id: 'k8s', label: 'kubernetes.yaml' },
                { id: 'circuit', label: 'circuit-breaker.ts' },
                { id: 'topology', label: 'topology.json' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedManifest(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    selectedManifest === tab.id ? 'bg-cyan-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-850 rounded-xl overflow-hidden relative">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
              <span className="font-mono text-[10px] text-gray-400">
                {selectedManifest === 'docker' ? 'docker-compose.distributed.yml' : selectedManifest === 'k8s' ? 'k8s-deployment.yaml' : selectedManifest === 'circuit' ? 'src/lib/circuitBreaker.ts' : 'topology.config.json'}
              </span>
              <button
                onClick={() => {
                  const code = selectedManifest === 'docker' 
                    ? dockerComposeCode 
                    : selectedManifest === 'k8s' 
                    ? k8sManifestCode 
                    : selectedManifest === 'circuit'
                    ? circuitBreakerCode
                    : topologyJsonCode;
                  copyToClipboard(code, selectedManifest);
                }}
                className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-3 py-1 text-[10px] font-bold rounded border border-gray-700 transition cursor-pointer flex items-center gap-1"
              >
                {copiedKey === selectedManifest ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>

            <pre className="p-4 bg-gray-950 font-mono text-[11px]/relaxed text-gray-300 max-h-[420px] overflow-auto custom-scrollbar select-text selection:bg-cyan-500/20">
              <code>
                {selectedManifest === 'docker' && dockerComposeCode}
                {selectedManifest === 'k8s' && k8sManifestCode}
                {selectedManifest === 'circuit' && circuitBreakerCode}
                {selectedManifest === 'topology' && topologyJsonCode}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
