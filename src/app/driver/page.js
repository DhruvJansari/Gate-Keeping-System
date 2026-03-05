"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TruckIcon, LoadingGoodsIcon, UnloadingGoodsIcon, CheckIcon, CloseIcon } from "@/components/Icons";

function NameInput({ onNext }) {
    const [name, setName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onNext(name.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
                <TruckIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome, Driver</h1>
            <p className="text-zinc-500 mb-8">Please enter your name to start the trip.</p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 text-lg text-center focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                >
                    Continue
                </button>
            </form>
        </div>
    );
}

const STAGE_LANGUAGES = {
    loading_site_at: {
        en: "The vehicle has arrived for loading.",
        hi: "माल भरने हेतु वाहन आ गया है।",
        gu: "માલ ભરવા માટે વાહન આવી ગયું છે।"
    },
    loading_point_in_at: {
        en: "The vehicle has been taken for loading.",
        hi: "माल भरने हेतु वाहन ले लिया गया है।",
        gu: "માલ ભરવા માટે વાહન લઈ લેવામાં આવ્યું છે।"
    },
    loading_point_out_at: {
        en: "The vehicle has been loaded and dispatched.",
        hi: "माल भरकर वाहन प्रस्थान कर गया है।",
        gu: "માલ ભરાઈને વાહન રવાના થઈ ગયું છે।"
    },
    unloading_site_at: {
        en: "The vehicle has arrived for unloading.",
        hi: "माल खाली करने हेतु वाहन आ गया है।",
        gu: "માલ ખાલી કરવા માટે વાહન આવી ગયું છે।"
    },
    unloading_point_in_at: {
        en: "The vehicle has been taken for unloading.",
        hi: "माल खाली करने हेतु वाहन ले लिया गया है।",
        gu: "માલ ખાલી કરવા માટે વાહન લઈ લેવામાં આવ્યું છે।"
    },
    unloading_point_out_at: {
        en: "The material has been completely unloaded.",
        hi: "माल पूर्ण रूप से खाली कर दिया गया है।",
        gu: "માલ સંપૂર્ણ રીતે ખાલી થઈ ગયો છે।"
    }
};

function ActiveEntryCard({ entry, driverName, onConfirmStage }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!entry.current_stage) return;
        
        if (confirm(`Confirm ${entry.current_stage.label}?`)) {
            setLoading(true);
            await onConfirmStage(entry.current_stage.field);
            setLoading(false);
        }
    };

    if (entry.is_completed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in duration-500">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-emerald-100">
                    <CheckIcon className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black text-zinc-900 mb-2">Journey Complete 🔵</h1>
                <p className="text-zinc-500 mb-6 max-w-xs mx-auto font-medium">
                    You have securely dispatched all logs for this cycle. The entry is securely closed.
                </p>
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm w-full max-w-sm space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-50">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cargo Identity</span>
                        <span className="font-bold text-zinc-900">{entry.product}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Licensed Unit</span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{entry.truck_no}</span>
                    </div>
                </div>
                 <p className="text-xs font-bold text-zinc-400 mt-8 uppercase tracking-widest">Secure session: {driverName}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/50 pb-safe">
            {/* Header / ID Badge */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-5 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-11 w-11 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                            <TruckIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                        </span>
                    </div>
                    <div>
                         <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Assigned Fleet</div>
                         <div className="font-mono font-bold text-zinc-900 text-lg leading-none">{entry.truck_no}</div>
                    </div>
                </div>
                 <div className="text-right">
                     <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Contract ID</div>
                     <div className="font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">CN-{entry.entry_id}</div>
                </div>
            </div>

            {/* Timeline Wrapper (Vertical Stepper) */}
            <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
                
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 px-2">Logistics Stage Flow</h3>
                
                <div className="relative space-y-0 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-300 before:to-transparent">
                  
                  {entry.stages?.map((stage, idx) => {
                      const isCompleted = stage.completed;
                      const isCurrent = entry.current_stage?.field === stage.field;
                      const isUpcoming = !isCompleted && !isCurrent;
                      
                      const t = STAGE_LANGUAGES[stage.field] || { en: stage.label, hi: "", gu: "" };

                      return (
                        <div key={stage.field} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-8 last:pb-0">
                          
                          {/* Marker */}
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors duration-500 ${
                              isCompleted 
                                ? 'bg-emerald-500 border-white ring-2 ring-emerald-200 z-10' 
                                : isCurrent 
                                  ? 'bg-blue-600 border-white ring-4 ring-blue-100 z-10 scale-125' 
                                  : 'bg-zinc-100 border-white ring-1 ring-zinc-200 z-0'
                          }`}>
                              {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
                              {isCurrent && <TruckIcon className="w-3.5 h-3.5 text-white animate-pulse" />}
                          </div>

                          {/* Card */}
                          <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl shadow-sm border transition-all duration-300 ${
                              isCurrent 
                                ? 'bg-white border-blue-200 ring-1 ring-blue-600 shadow-blue-500/10 scale-[1.02]' 
                                : isCompleted 
                                  ? 'bg-zinc-50/80 border-zinc-200 opacity-80' 
                                  : 'bg-white border-zinc-100 opacity-60 grayscale'
                          }`}>
                              <div className="flex items-center justify-between mb-2">
                                  <h4 className={`font-bold text-sm ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                      {stage.label}
                                  </h4>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                      isCompleted ? 'bg-emerald-100 text-emerald-700' : 
                                      isCurrent ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                                      'bg-zinc-100 text-zinc-400'
                                  }`}>
                                      {isCompleted ? 'Completed 🟢' : isCurrent ? 'Active 🟡' : 'Locked ⚪'}
                                  </span>
                              </div>
                              
                              <div className="space-y-1 mt-3 border-t border-zinc-100/60 pt-2">
                                  <p className={`text-xs font-semibold leading-tight ${isCurrent ? 'text-zinc-900' : 'text-zinc-500'}`}>{t.en}</p>
                                  <p className={`text-[11px] leading-tight ${isCurrent ? 'text-zinc-700' : 'text-zinc-400'}`}>{t.hi}</p>
                                  <p className={`text-[11px] leading-tight ${isCurrent ? 'text-zinc-700' : 'text-zinc-400'}`}>{t.gu}</p>
                              </div>
                              
                              {stage.timestamp && (
                                 <div className="mt-3 text-[10px] font-mono text-zinc-400">
                                     {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              )}
                          </div>
                        </div>
                      )
                  })}
                </div>
            </div>

            {/* Sticky Action Footer */}
            {entry.current_stage && (
                <div className="sticky bottom-0 z-20 bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-5 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-zinc-300 disabled:to-zinc-400 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-lg font-black tracking-wide rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden relative group"
                    >
                        {loading ? (
                           <>
                             <span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span> 
                             Processing Transit...
                           </>
                        ) : (
                            <>
                              <span className="absolute inset-0 w-full h-full -mt-1 rounded-2xl opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                              <CheckIcon className="h-6 w-6 relative z-10" />
                              <span className="relative z-10 uppercase tracking-widest text-sm">Confirm & Proceed</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-4">
                        Logged securely as: <span className="text-zinc-600">{driverName}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

export default function DriverDashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState("LOADING"); // LOADING, NAME, FETCHING, ACTIVE, NO_ENTRY
    const [driverName, setDriverName] = useState("");
    const [activeEntry, setActiveEntry] = useState(null);

    // Initial Role Check & Name Restore
    useEffect(() => {
        if (!loading) {
            if (!user || user.role_name !== 'Driver') {
                router.replace('/login');
                return;
            }
            
            const storedName = sessionStorage.getItem(`driver_name_${user.username}`);
            if (storedName) {
                setDriverName(storedName);
                setStep("FETCHING");
            } else {
                setStep("NAME");
            }
        }
    }, [user, loading, router]);

    // Fetch Active Entry
    useEffect(() => {
        if (step === "FETCHING") {
            const fetchEntry = async () => {
                try {
                    const res = await fetch("/api/driver/active-entry");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.active) {
                            setActiveEntry(data);
                            setStep("ACTIVE");
                        } else {
                            setStep("NO_ENTRY");
                        }
                    } else {
                        // If 401, maybe token expired
                         toast.error("Session expired");
                         router.push('/login');
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to load active trip");
                }
            };
            fetchEntry();
        }
    }, [step, router]);

    const handleNameSubmit = (name) => {
        setDriverName(name);
        sessionStorage.setItem(`driver_name_${user.username}`, name);
        setStep("FETCHING");
    };

    const handleConfirmStage = async (stageKey) => {
        try {
            const res = await fetch("/api/driver/confirm-stage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entry_id: activeEntry.entry_id,
                    stage_key: stageKey
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Confirmation failed");

            toast.success("Stage Confirmed!");
            
            // Refresh entry status
            setStep("FETCHING");

        } catch (err) {
            toast.error(err.message);
        }
    };
    
    const handleLogout = () => {
       // Clear session storage and context
       sessionStorage.clear();
       logout();
       router.replace('/login');
    };

    if (loading || step === "LOADING") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-100">
            {step === "NAME" && <NameInput onNext={handleNameSubmit} />}
            
            {step === "ACTIVE" && (
                <ActiveEntryCard 
                    entry={activeEntry} 
                    driverName={driverName} 
                    onConfirmStage={handleConfirmStage}
                />
            )}

            {step === "NO_ENTRY" && (
                <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                     <div className="h-20 w-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                        <CloseIcon className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">No Active Trips</h1>
                    <p className="text-zinc-500 mb-8 max-w-xs mx-auto">
                        There are no open logistic entries assigned to your vehicle ({user?.username}).
                    </p>
                    <button 
                        onClick={() => setStep("FETCHING")}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        Refresh
                    </button>
                     <button 
                        onClick={handleLogout}
                        className="mt-8 text-zinc-400 text-sm hover:text-zinc-600"
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
