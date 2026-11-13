import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  BookOpen,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Share2,
} from 'lucide-react';
import { ResearchReport } from '../../services/researchService';
import { toast } from '../../stores/useToastStore';

interface ResearchReportViewerProps {
  report: ResearchReport;
  stepsCompleted?: number;
  totalSources?: number;
}

export const ResearchReportViewer: React.FC<ResearchReportViewerProps> = ({
  report,
  stepsCompleted = 8,
  totalSources = 6,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleExportMarkdown = () => {
    let md = `# ${report.title}\n\n`;
    md += `*Generated via SupremeAI Deep Research Engine · Sources: ${report.sources.length} · Steps: ${stepsCompleted}*\n\n`;
    md += `## Executive Summary\n${report.summary}\n\n---\n\n`;

    report.sections.forEach((sec, idx) => {
      md += `### ${sec.title}\n\n${sec.content}\n\n`;
      if (sec.sources && sec.sources.length > 0) {
        md += `**Sources:** ${sec.sources.join(', ')}\n\n`;
      }
    });

    if (report.sources.length > 0) {
      md += `## References & Sources\n`;
      report.sources.forEach((src, idx) => {
        md += `[${idx + 1}] [${src.title}](${src.url}) - ${src.snippet || ''}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report Exported', 'Downloaded as Markdown file.');
  };

  return (
    <div className="my-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-950 p-5 shadow-xl text-slate-100 font-sans space-y-4">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Deep Research Report
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {stepsCompleted} steps · {report.sources.length || totalSources} sources
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">{report.title}</h3>
          </div>
        </div>

        <button
          onClick={handleExportMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export .md</span>
        </button>
      </div>

      {/* Summary Callout */}
      {report.summary && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-1">
            Executive Synthesis
          </span>
          {report.summary}
        </div>
      )}

      {/* Report Sections */}
      <div className="space-y-3">
        {report.sections.map((section, idx) => {
          const isExpanded = expandedSections[idx] !== false;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-xs text-slate-200">{section.title}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-slate-300 leading-relaxed space-y-2 border-t border-slate-800/60 font-sans">
                  <p className="whitespace-pre-wrap">{section.content}</p>

                  {section.sources && section.sources.length > 0 && (
                    <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-slate-500">Cited:</span>
                      {section.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-cyan-400 inline-flex items-center gap-0.5"
                        >
                          <span>[{sIdx + 1}]</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sources & Bibliography Footer */}
      {report.sources && report.sources.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Primary Sources & Citations ({report.sources.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors flex items-start justify-between group cursor-pointer text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <span className="font-medium text-slate-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                    [{idx + 1}] {source.title}
                  </span>
                  {source.snippet && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">{source.snippet}</p>
                  )}
                  <span className="text-[10px] text-cyan-400 font-mono truncate block">{source.url}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
