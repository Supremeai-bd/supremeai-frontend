import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Terminal, Globe, Code2, X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { useWorkspaceStore, WorkspaceTab } from '../../stores/useWorkspaceStore';
import { WorkspacePreviewTab } from './WorkspacePreviewTab';
import { WorkspaceTerminalTab } from './WorkspaceTerminalTab';
import { WorkspaceBrowserTab } from './WorkspaceBrowserTab';
import { WorkspaceCodeTab } from './WorkspaceCodeTab';

export const WorkspaceDock: React.FC = () => {
  const {
    isDockOpen,
    dockWidthPercent,
    activeDockTab,
    setDockOpen,
    setDockWidthPercent,
    setActiveDockTab,
  } = useWorkspaceStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const totalWidth = window.innerWidth;
      const newWidthPx = totalWidth - e.clientX;
      const newPct = (newWidthPx / totalWidth) * 100;
      setDockWidthPercent(newPct);
    },
    [isDragging, setDockWidthPercent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isDockOpen) return null;

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'browser', label: 'Browser', icon: Globe },
    { id: 'code', label: 'Code', icon: Code2 },
  ];

  return (
    <aside
      style={isMaximized ? { width: '100%' } : undefined}
      className={`${
        isMaximized
          ? 'absolute inset-0 z-40 flex'
          : 'fixed inset-0 z-40 lg:static lg:inset-auto flex'
      } flex-col h-full border-l border-slate-200 dark:border-cyan-500/20 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl shadow-2xl shrink-0 transition-[box-shadow] ${
        !isMaximized ? 'lg:w-[var(--dock-w)]' : ''
      }`}
      ref={(el) => {
        if (el && !isMaximized) {
          el.style.setProperty('--dock-w', `${dockWidthPercent}%`);
        }
      }}
    >
      {/* Left Resizable Divider Handle */}
      {!isMaximized && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          title="Drag to resize Workspace Dock"
          className={`absolute -left-1.5 top-0 bottom-0 w-3 z-30 cursor-col-resize flex items-center justify-center group ${
            isDragging ? 'bg-cyan-500/20' : 'hover:bg-cyan-500/10'
          }`}
        >
          <div className="w-1 h-12 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-cyan-400 transition-colors flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      )}

      {/* Dragging overlay so iframes don't steal mouse events */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* Top Dock Navigation Bar */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between gap-2 bg-slate-50/90 dark:bg-[#0b101b]">
        {/* Segmented Workspace Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeDockTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDockTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Split View' : 'Maximize Workspace Dock'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMaximized(false);
              setDockOpen(false);
            }}
            title="Close Workspace Dock"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Workspace Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeDockTab === 'preview' && <WorkspacePreviewTab />}
        {activeDockTab === 'terminal' && <WorkspaceTerminalTab />}
        {activeDockTab === 'browser' && <WorkspaceBrowserTab />}
        {activeDockTab === 'code' && <WorkspaceCodeTab />}
      </div>
    </aside>
  );
};
