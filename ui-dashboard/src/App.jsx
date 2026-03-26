import React, { useState } from "react";
import { ethers } from "ethers";
import {
  ShieldCheck,
  FileSearch,
  Activity,
  Database,
  RefreshCw,
} from "lucide-react";

const PATCH_MANAGER_ABI = [
  "function getPatch(uint256) view returns (tuple(uint256 id, address proposer, address targetContract, address patchedContract, string ipfsHash, string description, uint8 status, uint256 timestamp))",
  "function nextId() view returns (uint256)",
];

const RPC_URL = "http://127.0.0.1:8545";

const statusLabel = (code) => {
  const n = Number(code);
  switch (n) {
    case 0:
      return "Proposed (0)";
    case 1:
      return "Approved (1)";
    case 2:
      return "Applied (2)";
    case 3:
      return "Rejected (3)";
    default:
      return `Unknown (${n})`;
  }
};

function App() {
  const [provider] = useState(() => new ethers.JsonRpcProvider(RPC_URL));

  // AI detector report
  const [report, setReport] = useState(null);

  // Deployments info
  const [deployments, setDeployments] = useState(null);

  // Patch manager + patch info
  const [managerAddress, setManagerAddress] = useState("");
  const [patchId, setPatchId] = useState(0);
  const [patch, setPatch] = useState(null);

  // Balances
  const [balances, setBalances] = useState(null);

  // UI state
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReportUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setReport(json);
        setStatusMessage("Loaded vulnerability report.json successfully.");
      } catch (err) {
        console.error(err);
        setStatusMessage("Failed to parse report.json.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeploymentsUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setDeployments(json);
        if (json.contracts && json.contracts.PatchManager) {
          setManagerAddress(json.contracts.PatchManager);
          setStatusMessage(
            "Loaded deployments.local.json and PatchManager address."
          );
        } else {
          setStatusMessage(
            "deployments.local.json loaded, but PatchManager address not found."
          );
        }
      } catch (err) {
        console.error(err);
        setStatusMessage("Failed to parse deployments.local.json.");
      }
    };
    reader.readAsText(file);
  };

  const fetchPatch = async () => {
    if (!managerAddress || !ethers.isAddress(managerAddress)) {
      setStatusMessage("Enter a valid PatchManager address.");
      return;
    }

    setLoading(true);
    setStatusMessage(`Fetching patch id ${patchId} from PatchManager...`);
    try {
      const patchManager = new ethers.Contract(
        managerAddress,
        PATCH_MANAGER_ABI,
        provider
      );
      const p = await patchManager.getPatch(patchId);
      const formatted = {
        id: p.id.toString(),
        proposer: p.proposer,
        targetContract: p.targetContract,
        patchedContract: p.patchedContract,
        ipfsHash: p.ipfsHash,
        description: p.description,
        status: statusLabel(p.status),
        rawStatusCode: p.status.toString(),
        timestamp: p.timestamp.toString(),
      };
      setPatch(formatted);
      setStatusMessage("Patch fetched successfully.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Error fetching patch. Check node / address.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    if (!patch || !patch.targetContract || !patch.patchedContract) {
      setStatusMessage("Fetch patch first to know contract addresses.");
      return;
    }

    setLoading(true);
    setStatusMessage("Fetching contract balances from Hardhat node...");

    try {
      const [balTarget, balPatched] = await Promise.all([
        provider.getBalance(patch.targetContract),
        provider.getBalance(patch.patchedContract),
      ]);

      const b = {
        targetContract: patch.targetContract,
        targetBalanceWei: balTarget.toString(),
        targetBalanceEth: ethers.formatEther(balTarget),
        patchedContract: patch.patchedContract,
        patchedBalanceWei: balPatched.toString(),
        patchedBalanceEth: ethers.formatEther(balPatched),
      };
      setBalances(b);
      setStatusMessage("Balances fetched successfully.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Error fetching balances. Is Hardhat node running?");
    } finally {
      setLoading(false);
    }
  };

  const nextIdPreview = async () => {
    if (!managerAddress || !ethers.isAddress(managerAddress)) {
      setStatusMessage("Enter a valid PatchManager address.");
      return;
    }

    setLoading(true);
    setStatusMessage("Reading next patch ID...");
    try {
      const patchManager = new ethers.Contract(
        managerAddress,
        PATCH_MANAGER_ABI,
        provider
      );
      const nextId = await patchManager.nextId();
      setStatusMessage(`Next patch ID on-chain: ${nextId.toString()}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Error reading nextId().");
    } finally {
      setLoading(false);
    }
  };

  const vulnerabilityCount = report?.findings?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Self-Healing Smart Contracts
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              AI Patch System · Connected to local Hardhat node (
              <span className="font-mono">{RPC_URL}</span>)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/70 border border-slate-700 rounded-full px-3 py-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>AI + Blockchain · Prototype</span>
          </div>
        </header>

        {/* Top stats */}
        <section className="grid md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/40">
              <FileSearch className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">AI Findings</p>
              <p className="text-lg font-semibold">
                {vulnerabilityCount}{" "}
                <span className="text-xs font-normal text-slate-400">
                  issues detected
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Patch Status</p>
              <p className="text-lg font-semibold">
                {patch ? patch.status : "Unknown"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40">
              <Database className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Manager Address</p>
              <p className="text-[11px] font-mono text-slate-300 truncate max-w-[200px]">
                {managerAddress || "not loaded"}
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main className="grid md:grid-cols-2 gap-4 items-start">
          {/* Left column: Inputs */}
          <div className="space-y-4">
            {/* Uploads */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-100 mb-1">
                1. Load AI Report & Deployment Info
              </h2>
              <p className="text-xs text-slate-400">
                Use the report generated by <code className="font-mono">detector.py</code>{" "}
                and deployments generated by{" "}
                <code className="font-mono">deploy_auto.js</code>.
              </p>

              <div className="space-y-2">
                <label className="text-xs text-slate-300">
                  Vulnerability Report (report.json)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleReportUpload}
                  className="block w-full text-xs text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-indigo-500/80 file:text-white hover:file:bg-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs text-slate-300">
                  Deployment Info (deployments.local.json)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleDeploymentsUpload}
                  className="block w-full text-xs text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                />
              </div>

              <div className="mt-3 space-y-1">
                <label className="text-xs text-slate-300">
                  PatchManager Address
                </label>
                <input
                  type="text"
                  value={managerAddress}
                  onChange={(e) => setManagerAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-mono"
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-300">
                    Patch ID
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={patchId}
                    onChange={(e) => setPatchId(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={fetchPatch}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Fetch Patch Details
                </button>
                <button
                  onClick={nextIdPreview}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium"
                >
                  Next Patch ID
                </button>
                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium"
                >
                  Live Contract Balances
                </button>
              </div>

              <p className="text-xs text-indigo-200 mt-2 min-h-[1.2rem]">
                {loading ? "Working..." : statusMessage}
              </p>
            </div>

            {/* Deployment summary */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <h3 className="text-xs font-medium text-slate-100 mb-1.5">
                Deployment Summary
              </h3>
              <p className="text-[11px] text-slate-400 mb-2">
                Parsed from <code className="font-mono">deployments.local.json</code>.
              </p>
              <pre className="text-[11px] leading-snug max-h-52 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-2">
                {deployments
                  ? JSON.stringify(deployments, null, 2)
                  : "Upload deployments.local.json to view current network contracts here."}
              </pre>
            </div>
          </div>

          {/* Right column: Outputs */}
          <div className="space-y-4">
            {/* AI findings */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <h3 className="text-xs font-medium text-slate-100 mb-1.5 flex items-center gap-2">
                AI Vulnerability Report
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  detector.py → report.json
                </span>
              </h3>
              <pre className="text-[11px] leading-snug max-h-52 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-2">
                {report
                  ? JSON.stringify(report, null, 2)
                  : "Upload AI report.json to inspect detected vulnerabilities (e.g., reentrancy_possible, state_update_after_call)."}
              </pre>
            </div>

            {/* Patch & balances */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <h3 className="text-xs font-medium text-slate-100 mb-2">
                Patch Details & Live State
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Current Patch from{" "}
                    <code className="font-mono">PatchManager.getPatch(id)</code>
                  </p>
                  <pre className="text-[11px] leading-snug max-h-40 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-2">
                    {patch
                      ? JSON.stringify(patch, null, 2)
                      : "Click \"Fetch Patch Details\" after loading deployments to view the applied AI patch metadata here."}
                  </pre>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Contract Balances (ETH)
                  </p>
                  <pre className="text-[11px] leading-snug max-h-40 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-2">
                    {balances
                      ? JSON.stringify(balances, null, 2)
                      : "Click \"Live Contract Balances\" after fetching a patch to see target & patched contract balances."}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
