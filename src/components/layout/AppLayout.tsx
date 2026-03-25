import { motion } from "framer-motion";
import { Menu, User } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Link } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebar-expanded');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  return (
    <div
      className="group/app min-h-screen bg-background text-foreground flex"
      data-sidebar-expanded={isSidebarExpanded}
    >
      <Sidebar onExpandedChange={setIsSidebarExpanded} isExpanded={isSidebarExpanded} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarExpanded ? (
                <Menu className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Search Bar
            <div className="flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-1.5 w-64 focus-within:border-primary/50 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search intersection..."
                className="bg-transparent border-none outline-none text-sm w-full font-mono placeholder:text-muted-foreground/50"
              />
            </div> */}
          </div>

          <div className="flex items-center gap-4">
            {/* <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full shadow-[0_0_8px_rgba(255,42,42,0.8)]" />
            </button> */}
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary to-secondary p-px">
              <Link to="/">
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
