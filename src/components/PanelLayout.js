"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// import { useTheme } from "@/context/ThemeContext";
import { getNavForRole, filterNavByPermissions } from "@/lib/roleConfig";
import { SunIcon, MoonIcon, CloseIcon, MenuIcon } from "@/components/Icons";

export function PanelLayout({
  children,
  title,
  roleName,
  sidebarCounts: countsProp,
}) {
  // This replacement content is just for `PanelLayout.js`. I will do `Icons.js` in a separate step or inline.
  // Actually, let's just use inline SVG for the chevron in the button to keep it simple and self-contained in this file modification if possible, or simpler: I will add the icons to Icons.js first in a separate tool call.

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for desktop collapse
  
  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setTimeout(() => setIsCollapsed(saved === 'true'), 0);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const [itemsCount, setItemsCount] = useState(null);
  const [partiesCount, setPartiesCount] = useState(null);
  const [transportersCount, setTransportersCount] = useState(null);
  const [usersCount, setUsersCount] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, permissions } = useAuth();
  // const { theme, toggleTheme } = useTheme();
  const role = roleName || user?.role_name;

  useEffect(() => {
    if (!user) return;
    if (countsProp?.items !== undefined) setTimeout(() => setItemsCount(countsProp.items), 0);
    else
      fetch("/api/items/count")
        .then((r) => r.json())
        .then((d) => setItemsCount(d.count ?? 0))
        .catch(() => setItemsCount(0));
    if (countsProp?.parties !== undefined) setTimeout(() => setPartiesCount(countsProp.parties), 0);
    else
      fetch("/api/parties/count")
        .then((r) => r.json())
        .then((d) => setPartiesCount(d.count ?? 0))
        .catch(() => setPartiesCount(0));
    if (countsProp?.transporters !== undefined)
      setTimeout(() => setTransportersCount(countsProp.transporters), 0);
    else
      fetch("/api/transporters/count")
        .then((r) => r.json())
        .then((d) => setTransportersCount(d.count ?? 0))
        .catch(() => setTransportersCount(0));
    if (countsProp?.users !== undefined) setTimeout(() => setUsersCount(countsProp.users), 0);
    else
      fetch("/api/users/count")
        .then((r) => r.json())
        .then((d) => setUsersCount(d.count ?? 0))
        .catch(() => setUsersCount(0));
  }, [
    role,
    countsProp?.items,
    countsProp?.parties,
    countsProp?.transporters,
    countsProp?.users,
  ]);

  useEffect(() => {
    const handler = () => {
      if (user) {
        fetch("/api/items/count")
          .then((r) => r.json())
          .then((d) => setItemsCount(d.count ?? 0))
          .catch(() => setItemsCount(0));
        fetch("/api/parties/count")
          .then((r) => r.json())
          .then((d) => setPartiesCount(d.count ?? 0))
          .catch(() => setPartiesCount(0));
        fetch("/api/transporters/count")
          .then((r) => r.json())
          .then((d) => setTransportersCount(d.count ?? 0))
          .catch(() => setTransportersCount(0));
        fetch("/api/users/count")
          .then((r) => r.json())
          .then((d) => setUsersCount(d.count ?? 0))
          .catch(() => setUsersCount(0));
      }
    };
    window.addEventListener("sidebar-counts-refresh", handler);
    return () => window.removeEventListener("sidebar-counts-refresh", handler);
  }, [role]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const allNavItems = getNavForRole(role);
  const navItems = filterNavByPermissions(allNavItems, permissions);
  const sidebarCounts = {
    ...countsProp,
    items: countsProp?.items ?? itemsCount,
    parties: countsProp?.parties ?? partiesCount,
    transporters: countsProp?.transporters ?? transportersCount,
    users: countsProp?.users ?? usersCount,
  };



  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-900/20 lg:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - Premium Light Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform bg-white border-r border-zinc-200 text-zinc-600 shadow-sm transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex h-full flex-col">
          <div className={`flex h-14 flex-shrink-0 items-center border-b border-zinc-200 px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-auto object-contain" 
              />
              {!isCollapsed && (
                <span className="font-bold text-zinc-900 whitespace-nowrap opacity-100 transition-opacity duration-300">
                  Gate System
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-2 hover:bg-zinc-100 lg:hidden text-zinc-500"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3 min-h-0 overflow-y-auto">
            {navItems.map((item, i) => {
              const isActive =
                pathname === item.path || pathname.startsWith(item.path + "/");
              const count = item.countKey
                ? sidebarCounts?.[item.countKey]
                : null;
              const IconComp = item.IconComponent;
              return (
                <Link
                  key={`${item.path}-${item.label}-${i}`}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={isCollapsed ? item.label : ""}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  } ${isCollapsed ? "justify-center" : "justify-between"}`}
                >
                  <div className="flex items-center gap-3">
                    {IconComp && <IconComp className={`h-5 w-5 shrink-0 ${isActive ? "text-blue-600" : "text-zinc-500"}`} />}
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && count !== null && count !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                       isActive ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {count}
                    </span>
                  )}
                  {isCollapsed && count !== null && count !== undefined && (
                     <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-zinc-200 p-3 bg-zinc-50/50">
             {!isCollapsed ? (
                <div>
                   <p className="truncate px-3 text-xs font-semibold text-zinc-900">
                  {user?.full_name || user?.username}
                </p>
                <p className="truncate px-3 text-xs text-zinc-500">
                  {user?.role_name}
                </p>
                </div>
             ) : (
                <div className="flex justify-center">
                   <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200">
                      {user?.username?.[0]?.toUpperCase()}
                   </div>
                </div>
             )}
          </div>
          
           {/* Collapse Toggle Button (Desktop Only) */}
          <button 
             onClick={toggleSidebar}
             className="hidden lg:flex items-center justify-center border-t border-zinc-200 p-3 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
             {isCollapsed ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
             ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
             )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col h-screen overflow-y-auto lg:min-w-0 transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded p-2 hover:bg-zinc-100 text-zinc-600 lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="truncate text-lg font-semibold text-zinc-900">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle - Locked to Light */}
            <button
              className="rounded-lg p-2 hover:bg-zinc-100 text-zinc-400 cursor-default"
              title="Light theme is active"
            >
              <SunIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors border border-zinc-200"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Global Background decorative elements - Subtle Light */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl opacity-50"></div>
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
