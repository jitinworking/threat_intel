import React, { useState } from 'react';
import { Play, Shield, Terminal, Skull, AlertTriangle, Zap, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

interface EmulationTask {
  id: string;
  tactic: string;
  technique: string;
  description: string;
  command: string;
  status: 'pending' | 'running' | 'success' | 'failed';
}

interface AptEmulationPlan {
  id: string;
  name: string;
  description: string;
  tasks: EmulationTask[];
}

const emulationPlans: AptEmulationPlan[] = [
  {
    id: 'apt29',
    name: 'APT29 (Cozy Bear)',
    description: 'Emulate stealthy credential access and lateral movement typical of Russian SVR operations.',
    tasks: [
      { id: 'T1059.001', tactic: 'Execution', technique: 'PowerShell', description: 'Execute Base64 encoded PowerShell payload.', command: 'powershell -exec bypass -e JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBtACgAWwBDAG8AbgB2AGUAcgB0AF0AOgA6AEYAcgBvAG0AQgBhAHMAZQA2ADQAUwB0AHIAaQBuAGcAKAAiAEgA...=', status: 'pending' },
      { id: 'T1003.001', tactic: 'Credential Access', technique: 'LSASS Memory', description: 'Dump LSASS memory using comsvcs.dll.', command: 'rundll32.exe C:\\windows\\System32\\comsvcs.dll, MiniDump 624 C:\\temp\\lsass.dmp full', status: 'pending' },
      { id: 'T1098', tactic: 'Persistence', technique: 'Account Manipulation', description: 'Add user to local administrators group.', command: 'net localgroup administrators attacker /add', status: 'pending' }
    ]
  },
  {
    id: 'lazarus',
    name: 'Lazarus Group',
    description: 'Emulate destructive payload deployment and SMB lateral movement.',
    tasks: [
      { id: 'T1047', tactic: 'Execution', technique: 'WMI', description: 'Remote process execution via WMI.', command: 'wmic /node:"192.168.1.50" process call create "cmd.exe /c start payload.exe"', status: 'pending' },
      { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact', description: 'Simulate ransomware file encryption (dry run).', command: 'cipher /e /s:C:\\Users\\Public\\Documents', status: 'pending' },
      { id: 'T1070.004', tactic: 'Defense Evasion', technique: 'File Deletion', description: 'Delete volume shadow copies.', command: 'vssadmin.exe Delete Shadows /All /Quiet', status: 'pending' }
    ]
  }
];

export const AdversaryEmulation: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<AptEmulationPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tasks, setTasks] = useState<EmulationTask[]>([]);

  const selectPlan = (plan: AptEmulationPlan) => {
    setSelectedPlan(plan);
    setTasks(plan.tasks.map(t => ({ ...t })));
  };

  const executeEmulation = () => {
    setIsExecuting(true);
    
    // Simulate sequential execution
    let currentTask = 0;
    
    const runNextTask = () => {
      if (currentTask >= tasks.length) {
        setIsExecuting(false);
        return;
      }
      
      setTasks(prev => {
        const newTasks = [...prev];
        newTasks[currentTask].status = 'running';
        return newTasks;
      });

      setTimeout(() => {
        setTasks(prev => {
          const newTasks = [...prev];
          // Randomly fail some tasks to simulate EDR blocking
          newTasks[currentTask].status = Math.random() > 0.7 ? 'failed' : 'success';
          return newTasks;
        });
        currentTask++;
        runNextTask();
      }, 2000);
    };

    runNextTask();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Play className="text-danger" size={28} /> Adversary Emulation (Atomic Red Team)
          </h1>
          <p className="text-muted text-sm mt-1">Select an APT profile to generate and execute safe, simulated attacks against your local EDR.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Plan Selector */}
        <div className="lg:col-span-4 glass-panel p-4 flex flex-col gap-4 border-white/10 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2 px-2">Emulation Profiles</h3>
          {emulationPlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedPlan?.id === plan.id ? 'bg-danger/15 border-danger/40' : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-white mb-2">
                <Skull size={16} className={selectedPlan?.id === plan.id ? 'text-danger' : 'text-muted'} />
                {plan.name}
              </div>
              <p className="text-xs text-slate-400">{plan.description}</p>
            </button>
          ))}
        </div>

        {/* Execution Engine */}
        <div className="lg:col-span-8 glass-panel border-white/10 flex flex-col h-full">
          {selectedPlan ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="text-warning" size={20} /> {selectedPlan.name} Emulation Plan
                  </h2>
                  <p className="text-sm text-muted mt-1">Executing Atomic Red Team scripts via local agent.</p>
                </div>
                <button
                  onClick={executeEmulation}
                  disabled={isExecuting}
                  className="px-6 py-2 bg-danger/20 hover:bg-danger/30 text-danger rounded border border-danger/30 font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-danger/20"
                >
                  {isExecuting ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  {isExecuting ? 'Executing...' : 'Run Emulation'}
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-slate-950/50 border border-white/10 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400">Step {index + 1}</span>
                        <span className="badge badge-primary">{task.id}</span>
                        <span className="text-sm font-bold text-white">{task.tactic}: {task.technique}</span>
                      </div>
                      <div>
                        {task.status === 'pending' && <span className="badge border-white/20 text-muted">Pending</span>}
                        {task.status === 'running' && <span className="badge badge-warning flex items-center gap-1"><RefreshCw size={10} className="animate-spin"/> Running</span>}
                        {task.status === 'success' && <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={10}/> Successful (Bypassed EDR)</span>}
                        {task.status === 'failed' && <span className="badge badge-danger flex items-center gap-1"><Shield size={10}/> Blocked by EDR</span>}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-sm text-slate-300">{task.description}</p>
                      <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-green-400 overflow-x-auto">
                        <span className="text-slate-500 mr-2">$</span>
                        {task.command}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 p-12 text-center">
              <Shield size={48} className="mb-4" />
              <h3 className="text-lg font-bold text-white">Select a Profile</h3>
              <p className="text-sm">Choose an APT profile to view and execute the Atomic Red Team emulation plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
