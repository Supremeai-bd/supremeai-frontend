import React, { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  ChevronRight,
  X,
  MessageSquarePlus,
  Send,
  Check,
} from 'lucide-react';
import { env } from '../../config/env';
import { toast } from '../../stores/useToastStore';

export interface WorkspaceTipItem {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionType: 'open-settings' | 'open-knowledge' | 'open-recipes' | 'toggle-research';
}

const WORKSPACE_TIPS: WorkspaceTipItem[] = [
  {
    id: 'tip-developer-mode',
    title: 'Need Developer Tools?',
    description:
      'Want API keys, live preview dock, or repository sync? Enable Developer Access anytime from Settings.',
    actionLabel: 'Open Settings',
    actionType: 'open-settings',
  },
  {
    id: 'tip-knowledge-rag',
    title: 'Chat with Your Documents',
    description:
      'Keep chat clutter-free by default — turn on Knowledge Base Grounding in Settings whenever you want document Q&A.',
    actionLabel: 'Open Settings',
    actionType: 'open-settings',
  },
  {
    id: 'tip-deep-research',
    title: 'Structured Deep Research',
    description:
      'Activate Research in the message bar for multi-angle analysis and citation-ready reports.',
    actionLabel: 'Toggle Research',
    actionType: 'toggle-research',
  },
  {
    id: 'tip-prompt-recipes',
    title: 'Ready-Made Prompt Recipes',
    description:
      'Browse curated templates for writing, planning, summarizing, or coding via the + menu in the chat bar.',
    actionLabel: 'Browse Recipes',
    actionType: 'open-recipes',
  },
  {
    id: 'tip-appearance',
    title: 'Live Screens & Reading Width',
    description:
      'Customize your ambient screen backdrop, theme mode, and reading column width in Settings.',
    actionLabel: 'Customize',
    actionType: 'open-settings',
  },
];

interface WorkspaceTipBarProps {
  visible: boolean;
  onAction: (actionType: WorkspaceTipItem['actionType']) => void;
  onMuteTips?: () => void;
}

export const WorkspaceTipBar: React.FC<WorkspaceTipBarProps> = ({
  visible,
  onAction,
  onMuteTips,
}) => {
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * WORKSPACE_TIPS.length)
  );

  if (!visible || dismissedThisSession) return null;

  const tip = WORKSPACE_TIPS[tipIndex % WORKSPACE_TIPS.length];

  const handleNext = () => {
    setTipIndex((prev) => (prev + 1) % WORKSPACE_TIPS.length);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <div className="px-3.5 py-2.5 rounded-xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <Lightbulb className="w-4 h-4 theme-accent-text shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white mr-1.5">
              {tip.title}:
            </span>
            <span>{tip.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {tip.actionLabel && (
            <button
              type="button"
              onClick={() => onAction(tip.actionType)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              {tip.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            title="Next tip"
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Next</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          {onMuteTips && (
            <button
              type="button"
              onClick={onMuteTips}
              title="Turn off tips (re-enable anytime in Settings)"
              className="px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Mute
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissedThisSession(true)}
            aria-label="Dismiss tip"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Occasional Product Micro-Survey ---

const SURVEY_STORAGE_KEY = 'supremeai_survey_state_v1';
const SUBMIT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const SNOOZE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface SurveyPersistedState {
  lastSubmittedAt?: number;
  lastDismissedAt?: number;
  neverAsk?: boolean;
}

type SurveyRating = 'great' | 'good' | 'okay' | 'needs_work';

const RATING_OPTIONS: { id: SurveyRating; label: string }[] = [
  { id: 'great', label: 'Great' },
  { id: 'good', label: 'Good' },
  { id: 'okay', label: 'Okay' },
  { id: 'needs_work', label: 'Needs work' },
];

interface WorkspaceMicroSurveyProps {
  totalUserMessages: number;
  userEmail?: string;
  developerMode: boolean;
  forceOpen?: boolean;
  onCloseForceOpen?: () => void;
}

export const WorkspaceMicroSurvey: React.FC<WorkspaceMicroSurveyProps> = ({
  totalUserMessages,
  userEmail,
  developerMode,
  forceOpen = false,
  onCloseForceOpen,
}) => {
  const [persisted, setPersisted] = useState<SurveyPersistedState>(() => {
    try {
      const saved = localStorage.getItem(SURVEY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [rating, setRating] = useState<SurveyRating | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDone, setSubmittedDone] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setSessionDismissed(false);
      setSubmittedDone(false);
    }
  }, [forceOpen]);

  const shouldAutoShow = useMemo(() => {
    if (persisted.neverAsk) return false;
    const now = Date.now();
    if (persisted.lastSubmittedAt && now - persisted.lastSubmittedAt < SUBMIT_COOLDOWN_MS) {
      return false;
    }
    if (persisted.lastDismissedAt && now - persisted.lastDismissedAt < SNOOZE_COOLDOWN_MS) {
      return false;
    }
    return totalUserMessages >= 4;
  }, [persisted, totalUserMessages]);

  const isVisible = forceOpen || (shouldAutoShow && !sessionDismissed);
  if (!isVisible) return null;

  const savePersisted = (next: SurveyPersistedState) => {
    setPersisted(next);
    try {
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleSnooze = () => {
    savePersisted({ ...persisted, lastDismissedAt: Date.now() });
    setSessionDismissed(true);
    onCloseForceOpen?.();
  };

  const handleNeverAsk = () => {
    savePersisted({ ...persisted, neverAsk: true, lastDismissedAt: Date.now() });
    setSessionDismissed(true);
    onCloseForceOpen?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await fetch(`${env.apiBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          suggestion: suggestion.trim(),
          userEmail,
          developerMode,
        }),
      });
      savePersisted({ ...persisted, lastSubmittedAt: Date.now() });
      setSubmittedDone(true);
      toast.success('Feedback Received', 'Thank you for helping us improve SupremeAI Studio.');
      setTimeout(() => {
        setSessionDismissed(true);
        onCloseForceOpen?.();
      }, 1100);
    } catch {
      toast.error('Submission Failed', 'Could not send feedback right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 space-y-3 text-slate-800 dark:text-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 theme-accent-text shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Quick Product Pulse
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              How has your SupremeAI experience been?
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSnooze}
          aria-label="Close survey"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {submittedDone ? (
        <div className="py-3 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4" />
          <span>Thanks! Your suggestion has been saved.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRating(opt.id)}
                className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  rating === opt.id
                    ? 'theme-accent-active font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Share a suggestion or feature you'd love to see (optional)..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSnooze}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer whitespace-nowrap"
              >
                Later
              </button>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={handleNeverAsk}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer whitespace-nowrap"
              >
                Don&apos;t ask
              </button>
            </div>

            <button
              type="submit"
              disabled={!rating || isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-btn-primary text-[11px] font-semibold disabled:opacity-45 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
