import React, { useState } from 'react';
import {
  Puzzle,
  Check,
  Sparkles,
  ExternalLink,
  Code2,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Plus,
  X,
} from 'lucide-react';
import { PluginItem } from '../../types';

interface UserPluginsViewProps {
  plugins: PluginItem[];
  onTogglePlugin: (id: string) => void;
  onAddCustomPlugin: (plugin: Omit<PluginItem, 'id'>) => void;
}

export const UserPluginsView: React.FC<UserPluginsViewProps> = ({
  plugins,
  onTogglePlugin,
  onAddCustomPlugin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Plugin form
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PluginItem['category']>('developer');
  const [version, setVersion] = useState('1.0.0');

  const filteredPlugins = plugins.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCustomPlugin({
      name: name.trim(),
      tagline: tagline.trim() || 'Custom extension plugin',
      description: description.trim() || 'User-defined plugin connector for SupremeAI Studio.',
      category,
      isEnabled: true,
      version: version.trim() || '1.0.0',
      author: 'Custom (User)',
    });

    setName('');
    setTagline('');
    setDescription('');
    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: PluginItem['category']) => {
    switch (cat) {
      case 'developer':
        return 'Developer Tool';
      case 'ai-grounding':
        return 'Grounding';
      case 'security':
        return 'Security';
      case 'productivity':
        return 'Productivity';
      default:
        return 'General';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Plugins & Extensions Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supercharge your SupremeAI experience with connectors for GitHub, live web documentation, code auditing, and exporters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Plugin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto max-w-full">
          {['all', 'developer', 'ai-grounding', 'security', 'productivity'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Plugins' : cat.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              plugin.isEnabled
                ? 'bg-white dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 shadow-xs'
                : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400">
                  <Puzzle className="w-4 h-4" />
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => onTogglePlugin(plugin.id)}
                  aria-label={`Toggle ${plugin.name}`}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    plugin.isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      plugin.isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {plugin.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  v{plugin.version}
                </span>
              </div>

              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                {getCategoryBadge(plugin.category)} · by {plugin.author}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {plugin.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {plugin.isEnabled ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Active in Chat
                  </span>
                ) : (
                  'Disabled'
                )}
              </span>

              <button
                type="button"
                onClick={() => onTogglePlugin(plugin.id)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
              >
                {plugin.isEnabled ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Plugin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold">Add Custom Plugin</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plugin Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jira Issue Sync"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Sync tickets directly into prompt"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="developer">Developer</option>
                    <option value="ai-grounding">AI Grounding</option>
                    <option value="security">Security</option>
                    <option value="productivity">Productivity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this extension do?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  Add Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
