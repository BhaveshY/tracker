import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  FolderKanban,
  Clock, 
  BookOpen, 
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Settings,
  X,
  Palette
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Time Tracker', href: '/time-tracker', icon: Clock },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Goals', href: '/goals', icon: Trophy },
];



function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-card border-r z-50 transition-transform -translate-x-full lg:translate-x-0",
        isOpen && "translate-x-0"
      )}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-xl text-foreground">ML Tracker</h1>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X size={22} />
            </Button>
          </div>

          <nav className="flex-grow">
            <div className="mb-6">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Main
              </p>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    asChild
                  >
                    <Link to={item.href} onClick={onClose}>
                      <Icon size={20} />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>

            
          </nav>

          <div className="mt-auto pt-4 border-t space-y-2">
            <div className="p-2">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Progress Goal</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Keep up the great work!
              </p>
              <Progress value={75} />
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3" asChild>
              <Link to="/settings">
                <Palette size={20} />
                <span className="flex-1">Settings</span>
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar; 