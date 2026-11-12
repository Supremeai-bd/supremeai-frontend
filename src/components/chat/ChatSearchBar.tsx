import React from 'react';
import { Search, X } from 'lucide-react';

interface ChatSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: 'all' | 'user' | 'assistant';
  onRoleFilterChange: (f: 'all' | 'user' | 'assistant') => void;
  totalMatches: number;
  totalMessages: number;
  onClear: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  totalMatches,
  totalMessages,
  onClear,
  inputRef,
}) => {
  return (
    <div className="sticky top-0 z-10 w-full px-4 py-2.5 bg-white/80 dark:bg-[#131314]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2">
        {/* Search input field */}
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-cyan-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages, code blocks, or reasoning output..."
            className="w-full pl-9 pr-9 py-1.5 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={onClear}
              className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter buttons & count */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end text-xs font-mono">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'user', 'assistant'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => onRoleFilterChange(filter)}
                className={`px-2 py-0.5 rounded-md text-[11px] capitalize transition-colors cursor-pointer ${
                  roleFilter === filter
                    ? 'bg-white dark:bg-slate-800 text-cyan-500 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'user' ? 'You' : 'AI'}
              </button>
            ))}
          </div>

          {searchQuery.trim() && (
            <span className="text-[11px] text-slate-400 shrink-0">
              {totalMatches}/{totalMessages} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
