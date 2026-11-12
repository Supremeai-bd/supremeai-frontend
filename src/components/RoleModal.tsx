import React, { useState } from 'react';
import { X, Check, Sliders, Info, Shield, Cpu, Zap, Code, Sparkles } from 'lucide-react';
import { RolePersona, ModelDetail } from '../types';
import { SYSTEM_ROLES } from '../data/roles';
import { GEMINI_MODELS } from '../data/models';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: RolePersona;
  customInstruction: string;
  onSaveRole: (role: RolePersona, customInstruction?: string) => void;
  activeModel: ModelDetail;
  onSelectModel: (model: ModelDetail) => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  customInstruction,
  onSaveRole,
  activeModel,
  onSelectModel,
}) => {
  const [selectedRole, setSelectedRole] = useState<RolePersona>(activeRole);
  const [instructionText, setInstructionText] = useState(
    customInstruction || activeRole.systemInstruction
  );

  if (!isOpen) return null;

  const handleRoleSelect = (role: RolePersona) => {
    setSelectedRole(role);
    setInstructionText(role.systemInstruction);
    // Find suggested model
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) {
      onSelectModel(matchedModel);
    }
  };

  const handleSave = () => {
    onSaveRole(selectedRole, instructionText);
    onClose();
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'supreme-architect':
        return <Cpu className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'supreme-fullstack':
        return <Code className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'supreme-fast-dev':
        return <Zap className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'supreme-security':
        return <Shield className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold">Configure Persona & System Instructions</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Roles Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
              Select Preset Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SYSTEM_ROLES.map((role) => {
                const isSelected = role.id === selectedRole.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-100/80 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-xs ring-1 ring-slate-400 dark:ring-slate-600'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-white">
                          {getRoleIcon(role.id)}
                          <span>{role.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {role.tagline}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Model: {role.suggestedModel.replace('gemini-', '')}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection Override */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Associated Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GEMINI_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model)}
                  className={`p-2 text-center rounded-lg border text-xs cursor-pointer transition-all ${
                    model.id === activeModel.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold border-slate-900 dark:border-slate-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">{model.name}</div>
                  <div className="text-[10px] opacity-75">{model.latencyRating}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom System Instruction Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                System Instruction (Prompt Configuration)
              </label>
              <button
                type="button"
                onClick={() => setInstructionText(selectedRole.systemInstruction)}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset to default
              </button>
            </div>
            <textarea
              rows={5}
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder="Define persona, technical guidelines, reasoning framework, or domain rules..."
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              The system instruction directs Gemini's tone, role boundaries, code standards, and response depth.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Apply Role
          </button>
        </div>
      </div>
    </div>
  );
};
