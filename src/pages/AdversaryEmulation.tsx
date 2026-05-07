import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Play, Shield, Skull, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

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

export const AdversaryEmulation: React.FC = () => {
  const [emulationPlans, setEmulationPlans] = useState<AptEmulationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AptEmulationPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tasks, setTasks] = useState<EmulationTask[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/emulation`);
        const data = await res.json();
        
        // Group tasks by tactic to create plans
        const groups: Record<string, EmulationTask[]> = {};
        data.forEach((row: any) => {
          if (!groups[row.tactic]) groups[row.tactic] = [];
          groups[row.tactic].push({
            id: row.mitre_id || row.id,
            tactic: row.tactic,
            technique: row.technique,
            description: row.description,
            command: row.procedure,
            status: 'pending'
          });
        });

        const plans: AptEmulationPlan[] = Object.entries(groups).map(([tactic, tasks], i) => ({
          id: `plan-${i}`,
          name: `${tactic} Emulation`,
          description: `Emulate techniques related to the ${tactic} tactic.`,
          tasks
        }));

        setEmulationPlans(plans);
      } catch (err) {
        console.error("Failed to fetch emulation plans:", err);
      }
    };
    fetchPlans();
  }, []);

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
        if (newTasks[currentTask]) {
          newTasks[currentTask] = { ...newTasks[currentTask], status: 'running' };
        }
        return newTasks;
      });

      setTimeout(() => {
        setTasks(prev => {
          const newTasks = [...prev];
          // Randomly fail some tasks to simulate EDR blocking
          if (newTasks[currentTask]) {
            newTasks[currentTask] = { ...newTasks[currentTask], status: Math.random() > 0.7 ? 'failed' : 'success' };
          }
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
