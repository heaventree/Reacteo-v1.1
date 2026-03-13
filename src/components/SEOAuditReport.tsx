import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { AuditResult } from '../lib/ai/types';

interface Suggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact?: string;
}

interface SEOAuditReportProps {
  result: AuditResult;
  onSuggestionsClick?: (suggestions: Suggestion[]) => void;
}

export const SEOAuditReport: React.FC<SEOAuditReportProps> = ({
  result,
  onSuggestionsClick,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const criticalIssues = result.issues.filter((i) => i.severity === 'high');
  const warningIssues = result.issues.filter((i) => i.severity === 'medium');

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-6 rounded-lg border ${getScoreBgColor(result.seoScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">SEO Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.seoScore)}`}>
                {result.seoScore}/100
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${getScoreColor(result.seoScore)}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${getScoreBgColor(result.readabilityScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Readability</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.readabilityScore)}`}>
                {result.readabilityScore}/100
              </p>
            </div>
            <CheckCircle2 className={`w-8 h-8 ${getScoreColor(result.readabilityScore)}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${getScoreBgColor(result.score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Overall</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}/100
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${getScoreColor(result.score)}`} />
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Critical Issues ({criticalIssues.length})
          </h3>
          <ul className="space-y-2">
            {criticalIssues.map((issue, i) => (
              <li key={i} className="text-sm text-red-800">
                <span className="font-medium">{issue.type}:</span> {issue.message}
                {issue.suggestion && (
                  <p className="text-red-700 mt-1">💡 {issue.suggestion}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warningIssues.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warnings ({warningIssues.length})
          </h3>
          <ul className="space-y-2">
            {warningIssues.map((issue, i) => (
              <li key={i} className="text-sm text-yellow-800">
                <span className="font-medium">{issue.type}:</span> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* H1 Issues */}
      {result.h1Issues.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Heading Issues</h3>
          <ul className="space-y-2">
            {result.h1Issues.map((issue, i) => (
              <li key={i} className="text-sm text-blue-800">
                <span className="font-medium">H1:</span> Found {issue.count}, expected{' '}
                {issue.expected} - {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Issues */}
      {result.metadataIssues.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-3">Metadata Issues</h3>
          <ul className="space-y-2">
            {result.metadataIssues.map((issue, i) => (
              <li key={i} className="text-sm text-purple-800">
                <span className="font-medium">{issue.field}:</span> {issue.message}
                {issue.recommendedValue && (
                  <p className="text-purple-700 mt-1">
                    Suggested: &quot;{issue.recommendedValue}&quot;
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Schema Issues */}
      {result.schemaIssues.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="font-semibold text-indigo-900 mb-3">Schema Issues</h3>
          <ul className="space-y-2">
            {result.schemaIssues.map((issue, i) => (
              <li key={i} className="text-sm text-indigo-800">
                <span className="font-medium">{issue.schemaType}:</span> {issue.message}
                {issue.missingFields && (
                  <p className="text-indigo-700 mt-1">
                    Missing: {issue.missingFields.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">
              Suggestions ({result.suggestions.length})
            </h3>
            {onSuggestionsClick && (
              <button
                onClick={() => onSuggestionsClick(result.suggestions)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {result.suggestions.slice(0, 5).map((suggestion, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-start gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      suggestion.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : suggestion.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {suggestion.priority}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{suggestion.title}</p>
                    <p className="text-slate-600 text-xs mt-1">{suggestion.description}</p>
                    {suggestion.estimatedImpact && (
                      <p className="text-slate-500 text-xs mt-1">
                        Impact: {suggestion.estimatedImpact}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
