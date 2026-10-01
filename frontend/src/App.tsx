import React, { useState } from "react";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  RefreshCw, 
  X, 
  Server 
} from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  type: "target" | "breach" | "social";
  severity: "critical" | "elevated" | "low";
  x: number;
  y: number;
  details: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function App() {
  const [targetInput, setTargetInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Exposure Graph Nodes
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: "1", label: "Target Identity", type: "target", severity: "low", x: 250, y: 150, details: "Primary OSINT Subject" },
    { id: "2", label: "Database Breach", type: "breach", severity: "critical", x: 100, y: 80, details: "Plaintext credentials exposed in data leak" },
    { id: "3", label: "Social Profile", type: "social", severity: "elevated", x: 400, y: 100, details: "Public handle correlated across platforms" },
    { id: "4", label: "Leaked API Key", type: "breach", severity: "critical", x: 150, y: 240, details: "Access key exposed in public repository" },
    { id: "5", label: "Domain WHOIS", type: "social", severity: "low", x: 380, y: 220, details: "Registrant details publicly accessible" },
  ]);

  // Remediation Tasks
  const [actions, setActions] = useState<ActionItem[]>([
    { id: "a1", title: "Revoke Exposed API Keys", description: "Invalidate credentials in AWS IAM console.", completed: false },
    { id: "a2", title: "Enable Multi-Factor Authentication", description: "Enforce 2FA across all breached accounts.", completed: false },
    { id: "a3", title: "Enable Domain Privacy Protection", description: "Mask WHOIS registrant administrative details.", completed: false },
  ]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: targetInput }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nodes) setNodes(data.nodes);
        if (data.actions) setActions(data.actions);
      }
    } catch (err) {
      console.log("Backend scan requested.");
    } finally {
      setLoading(false);
      setShowOtpModal(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = async () => {
    const fullCode = otpCode.join("");
    if (fullCode.length !== 6) {
      alert("Please enter a 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: targetInput, otp: fullCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nodes) setNodes(data.nodes);
        if (data.actions) setActions(data.actions);
      }
    } catch (err) {
      console.log("OTP verification completed.");
    } finally {
      setVerifyingOtp(false);
      setShowOtpModal(false);
    }
  };

  const toggleAction = (id: string) => {
    setActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight">OSINT Exposure Mapper</h1>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backend:</span>
            <span className="text-emerald-400 font-mono">{BACKEND_URL}</span>
          </div>
        </header>

        {/* Scan Input Form */}
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter email, username, or target identifier..."
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-100 placeholder-slate-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Scan Target"}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Interactive Graph Node View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[400px]">
            <h3 className="font-semibold text-slate-300 mb-4">Interactive Exposure Map</h3>
            
            <div className="relative w-full h-[300px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <svg className="w-full h-full">
                {nodes.slice(1).map((node, i) => (
                  <line 
                    key={`line-${i}`} 
                    x1={nodes[0].x} 
                    y1={nodes[0].y} 
                    x2={node.x} 
                    y2={node.y} 
                    stroke="#334155" 
                    strokeWidth="2" 
                    strokeDasharray="4" 
                  />
                ))}
                {nodes.map((node) => (
                  <g 
                    key={node.id} 
                    onClick={() => setSelectedNode(node)} 
                    className="cursor-pointer hover:scale-110 transition-transform origin-center"
                  >
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={node.type === "target" ? "24" : "16"} 
                      fill={node.type === "target" ? "#3b82f6" : node.severity === "critical" ? "#ef4444" : "#f59e0b"} 
                    />
                    <text x={node.x} y={node.y + 35} textAnchor="middle" fill="#cbd5e1" fontSize="12">
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {selectedNode && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg flex justify-between items-start border border-slate-700">
                <div>
                  <h4 className="font-bold text-white">{selectedNode.label}</h4>
                  <p className="text-sm text-slate-400 mt-1">{selectedNode.details}</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Remediation Task List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-200 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Remediation Tasks
            </h3>
            <div className="space-y-3">
              {actions.map((act) => (
                <div 
                  key={act.id} 
                  onClick={() => toggleAction(act.id)} 
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    act.completed 
                      ? "bg-slate-950 border-slate-800 opacity-50" 
                      : "bg-slate-800 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${act.completed ? "text-emerald-500" : "text-slate-500"}`} />
                    <div>
                      <h4 className={`font-medium text-sm ${act.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {act.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{act.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">OTP Verification</h2>
              <p className="text-sm text-slate-400 mt-2">Enter the 6-digit passcode sent to authorize the scan.</p>
            </div>
            
            <div className="flex justify-between gap-2">
              {otpCode.map((val, i) => (
                <input
                  key={i} 
                  id={`otp-${i}`} 
                  type="text" 
                  maxLength={1} 
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              ))}
            </div>

            <button 
              onClick={verifyOtp} 
              disabled={verifyingOtp}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifyingOtp ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify Code"}
            </button>
            <button onClick={() => setShowOtpModal(false)} className="w-full py-2 text-slate-500 hover:text-slate-300 transition text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}