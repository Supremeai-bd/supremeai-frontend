import React, { useState } from 'react';
import { BookOpen, Search, Plus, Sparkles, Copy, Check, ArrowRight, X, Trash2, Tag } from 'lucide-react';
import { PromptTemplateItem } from '../../types';
import { INITIAL_PROMPT_TEMPLATES } from '../../data/customerWorkspaceData';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateText: string) => void;
  developerMode?: boolean;
}

const NON_DEV_CATEGORIES = new Set<PromptTemplateItem['category']>(['writing', 'research', 'general']);

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  developerMode = false,
}) => {
  const [templates, setTemplates] = useState<PromptTemplateItem[]>(() => {
    const saved = localStorage.getItem('supremeai_custom_prompts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PROMPT_TEMPLATES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New template form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplateItem['category']>(
    developerMode ? 'code' : 'general'
  );
  const [newDescription, setNewDescription] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [newTags, setNewTags] = useState('');

  if (!isOpen) return null;

  const categories = developerMode
    ? ['all', 'security', 'code', 'architecture', 'review', 'writing', 'research', 'general']
    : ['all', 'writing', 'research', 'general'];

  const activeCategory = categories.includes(selectedCategory) ? selectedCategory : 'all';

  const visibleTemplates = developerMode
    ? templates
    : templates.filter((t) => NON_DEV_CATEGORIES.has(t.category));

  const filteredTemplates = visibleTemplates.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTemplate.trim()) return;

    const created: PromptTemplateItem = {
      id: `tmpl_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom prompt template created in workspace.',
      template: newTemplate.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };

    const updated = [created, ...templates];
    setTemplates(updated);
    localStorage.setItem('supremeai_custom_prompts', JSON.stringify(updated));

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewTemplate('');
    setNewTags('');
    setIsCreating(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('supremeai_custom_prompts', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f141f] border border-slate-700 shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0d14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Prompt Templates & Recipes
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono">
                  {visibleTemplates.length} saved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {developerMode
                  ? 'Reusable system instructions and structured workflow prompts'
                  : 'Ready-to-use writing, research, and everyday productivity prompts'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isCreating ? 'Back to Library' : 'New Template'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isCreating ? (
            <form onSubmit={handleCreateTemplate} className="space-y-4 max-w-xl mx-auto">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Create Custom Prompt Recipe
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Microservice Resiliency Architecture Checker"
                  required
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={developerMode ? newCategory : (NON_DEV_CATEGORIES.has(newCategory) ? newCategory : 'general')}
                    onChange={(e) => setNewCategory(e.target.value as PromptTemplateItem['category'])}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {developerMode && (
                      <>
                        <option value="code">Code & Syntax</option>
                        <option value="security">Security & Audit</option>
                        <option value="architecture">Architecture</option>
                        <option value="review">Code Review</option>
                      </>
                    )}
                    <option value="writing">Writing & Comms</option>
                    <option value="research">Research & Summaries</option>
                    <option value="general">General Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="rag, audit, docker"
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Short Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Quick summary of what this prompt accomplishes..."
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prompt Template Body</label>
                <textarea
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="Enter prompt instructions, placeholders [LIKE THIS], and formatted guidance..."
                  rows={6}
                  required
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Search and Category Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompt templates by title, description or tags..."
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                        activeCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-col justify-between p-4 rounded-xl bg-[#0a0d14]/70 border border-slate-800 hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {template.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>

                      <div className="p-2.5 rounded-lg bg-[#06080c] border border-slate-800/80 mb-3">
                        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap line-clamp-3">
                          {template.template}
                        </pre>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(template.id, template.template)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                          title="Copy template text"
                        >
                          {copiedId === template.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {template.id.startsWith('tmpl_') && template.id.length > 10 && (
                          <button
                            onClick={() => handleDeleteCustom(template.id)}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 text-xs transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onSelectTemplate(template.template);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow transition-all cursor-pointer"
                      >
                        Use in Chat
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                    No prompt recipes matched your query. Try searching for different keywords or create a new template.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
