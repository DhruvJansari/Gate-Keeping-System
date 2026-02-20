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
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckIcon className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Trip Completed!</h1>
                <p className="text-zinc-500 mb-6 max-w-xs mx-auto">
                    You have confirmed all stages for this trip. The entry is now closed.
                </p>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 w-full max-w-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</span>
                        <span className="font-bold text-zinc-900">{entry.product}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vehicle</span>
                        <span className="font-mono font-bold text-zinc-700">{entry.truck_no}</span>
                    </div>
                </div>
                 <p className="text-xs text-zinc-400 mt-8">Logged in as {driverName}</p>
            </div>
        );
    }

    const getStageIcon = (key) => {
        if (key.includes('loading')) return <LoadingGoodsIcon className="h-6 w-6" />;
        return <UnloadingGoodsIcon className="h-6 w-6" />;
    };

    return (
        <div className="p-4 flex flex-col min-h-screen pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm">
                        <TruckIcon className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                         <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Vehicle</div>
                         <div className="font-mono font-bold text-zinc-900">{entry.truck_no}</div>
                    </div>
                </div>
                 <div className="text-right">
                     <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Driver</div>
                     <div className="font-medium text-zinc-700">{driverName}</div>
                </div>
            </div>

            {/* Main Card */}
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden mb-8">
                    <div className="bg-zinc-50 border-b border-zinc-100 p-6 text-center">
                        <h2 className="text-lg font-medium text-zinc-500 mb-1">Current Shipment</h2>
                        <div className="text-3xl font-black text-zinc-900 tracking-tight">{entry.product}</div>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="mb-6 h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                            {getStageIcon(entry.current_stage.field)}
                        </div>
                        <h3 className="text-zinc-400 font-medium uppercase tracking-widest text-sm mb-2">Next Stage</h3>
                        <div className="text-2xl font-bold text-blue-600 mb-2">{entry.current_stage.label}</div>
                        <p className="text-zinc-500 text-sm">Confirm this action to proceed.</p>
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xl font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? (
                       <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span> 
                    ) : (
                        <CheckIcon className="h-6 w-6" />
                    )}
                    {loading ? "Confirming..." : "Confirm Stage"}
                </button>
            </div>
            
            <div className="text-center text-xs text-zinc-300 mt-auto pt-8">
                Logistic ID #{entry.entry_id}
            </div>
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
