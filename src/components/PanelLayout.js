"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// import { useTheme } from "@/context/ThemeContext";
import { getNavForRole, filterNavByPermissions } from "@/lib/roleConfig";
import { SunIcon, MoonIcon, CloseIcon, MenuIcon } from "@/components/Icons";

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
   return (
     <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
     </svg>
   );
 }

export function PanelLayout({
  children,
  title,
  roleName,
  sidebarCounts: countsProp,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for desktop collapse
  
  // Track open menus
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
     setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

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
  const [vehiclesCount, setVehiclesCount] = useState(null);
  const [driversCount, setDriversCount] = useState(null);
  const [brokersCount, setBrokersCount] = useState(null);

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, permissions } = useAuth();
  // const { theme, toggleTheme } = useTheme();
  const role = roleName || user?.role_name;

  useEffect(() => {
    if (!user) return;
    
    const fetchCount = (url, setter, propVal) => {
       if (propVal !== undefined) setTimeout(() => setter(propVal), 0);
       else fetch(url).then(r => r.json()).then(d => setter(d.count ?? 0)).catch(() => setter(0));
    };

    fetchCount("/api/items/count", setItemsCount, countsProp?.items);
    fetchCount("/api/parties/count", setPartiesCount, countsProp?.parties);
    fetchCount("/api/transporters/count", setTransportersCount, countsProp?.transporters);
    fetchCount("/api/users/count", setUsersCount, countsProp?.users);
    fetchCount("/api/vehicles/count", setVehiclesCount, countsProp?.vehicles);
    fetchCount("/api/drivers/count", setDriversCount, countsProp?.drivers);
    fetchCount("/api/brokers/count", setBrokersCount, countsProp?.brokers);

  }, [role, countsProp]);

  useEffect(() => {
    const handler = () => {
      if (user) {
         fetch("/api/items/count").then(r => r.json()).then(d => setItemsCount(d.count ?? 0)).catch(() => {});
         fetch("/api/parties/count").then(r => r.json()).then(d => setPartiesCount(d.count ?? 0)).catch(() => {});
         fetch("/api/transporters/count").then(r => r.json()).then(d => setTransportersCount(d.count ?? 0)).catch(() => {});
         fetch("/api/users/count").then(r => r.json()).then(d => setUsersCount(d.count ?? 0)).catch(() => {});
         fetch("/api/vehicles/count").then(r => r.json()).then(d => setVehiclesCount(d.count ?? 0)).catch(() => {});
         fetch("/api/drivers/count").then(r => r.json()).then(d => setDriversCount(d.count ?? 0)).catch(() => {});
         fetch("/api/brokers/count").then(r => r.json()).then(d => setBrokersCount(d.count ?? 0)).catch(() => {});
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
    vehicles: countsProp?.vehicles ?? vehiclesCount,
    drivers: countsProp?.drivers ?? driversCount,
    brokers: countsProp?.brokers ?? brokersCount,
  };

  // Helper to check if a group should be open based on current path
  useEffect(() => {
     if (navItems) {
        navItems.forEach(item => {
           if (item.children) {
              const hasActiveChild = item.children.some(child => pathname === child.path || pathname.startsWith(child.path + "/"));
              if (hasActiveChild) {
                 setOpenMenus(prev => ({ ...prev, [item.label]: true }));
              }
           }
        });
     }
  }, [pathname, navItems]); // Only run when path changes or nav items load

  const renderNavItem = (item, i, depth = 0) => {
      // Logic: 
      // If item has children:
      //   - If item.path exists: The main area is a Link to item.path. The Chevron is a button to toggle children.
      //   - If item.path does NOT exist: The whole area is a button to toggle children.
      
      const isOpen = openMenus[item.label];
      const hasChildren = item.children && item.children.length > 0;
      const IconComp = item.IconComponent;
      
      // Check active states
      const isActive = item.path && (pathname === item.path);
      const isChildActive = hasChildren && item.children.some(child => pathname === child.path || pathname.startsWith(child.path + "/"));
      // Main item is "active" if it's the current path OR one of its children is active
      const isMainActive = isActive || isChildActive;

      const baseClasses = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
         isMainActive
         ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
         : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      } ${isCollapsed ? "justify-center" : "justify-between"} ${depth > 0 ? "ml-4" : ""}`;

      if (hasChildren) {
         return (
            <div key={`${item.label}-${i}`} className="space-y-1">
               <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} ${
                  isMainActive ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "hover:bg-zinc-50 text-zinc-600"
               } rounded-lg transition-colors`}>
                  
                  {/* Left Side: Link or Button */}
                  {item.path ? (
                     <Link
                        href={item.path}
                        onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isCollapsed ? "justify-center" : ""}`}
                        title={isCollapsed ? item.label : ""}
                     >
                        {IconComp && <IconComp className={`h-5 w-5 shrink-0 ${isMainActive ? "text-blue-600" : "text-zinc-500"}`} />}
                        {!isCollapsed && <span>{item.label}</span>}
                     </Link>
                  ) : (
                     <button
                        onClick={() => !isCollapsed && toggleMenu(item.label)}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isCollapsed ? "justify-center" : "text-left"}`}
                        title={isCollapsed ? item.label : ""}
                     >
                        {IconComp && <IconComp className={`h-5 w-5 shrink-0 ${isMainActive ? "text-blue-600" : "text-zinc-500"}`} />}
                        {!isCollapsed && <span>{item.label}</span>}
                     </button>
                  )}

                  {/* Right Side: Chevron Toggle */}
                  {!isCollapsed && (
                     <button
                        onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           toggleMenu(item.label);
                        }}
                        className="p-2.5 hover:bg-black/5 rounded-r-lg transition-colors"
                     >
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                     </button>
                  )}
               </div>
               
               {/* Dropdown Content */}
               {!isCollapsed && isOpen && (
                  <div className="pl-4 space-y-1 relative">
                     <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-200" />
                     {item.children.map((child, j) => renderNavItem(child, j, depth + 1))}
                  </div>
               )}
            </div>
         );
      }

      // Standard Item (No Children)
      const count = item.countKey ? sidebarCounts?.[item.countKey] : null;

      return (
         <Link
            key={`${item.path}-${item.label}-${i}`}
            href={item.path}
            onClick={() => {
               if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            title={isCollapsed ? item.label : ""}
            className={baseClasses}
         >
            <div className={`flex items-center gap-3 ${depth > 0 ? "text-xs" : ""}`}>
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
            {navItems.map((item, i) => renderNavItem(item, i))}
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
