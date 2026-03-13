import React, { useState } from 'react';
import { PlayCircle, AlertCircle, CheckCircle2, Search, Image as ImageIcon, Bot, Filter } from 'lucide-react';

export interface SeoPageRecord {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  images_missing_alt: number;
  needs_audit: boolean;
  score: number | null;
  is_published: boolean;
  generated_by_ai: boolean;
}

interface BulkOperationsViewProps {
  pages: SeoPageRecord[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRunAudit: (pageIds: string[]) => Promise<void>;
  onRunAiGeneration: (pageIds: string[]) => Promise<void>;
}

export const BulkOperationsView: React.FC<BulkOperationsViewProps> = ({
  pages,
  totalCount,
  onRunAudit,
  onRunAiGeneration
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === pages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pages.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: 'audit' | 'ai') => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      if (action === 'audit') {
        await onRunAudit(Array.from(selectedIds));
      } else {
        await onRunAiGeneration(Array.from(selectedIds));
      }
      setSelectedIds(new Set());
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Operations</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {totalCount.toLocaleString()} pages indexed. Use templates or AI to generate missing tags in bulk.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
            {selectedIds.size} pages selected
          </span>
          <div className="flex gap-3">
             <button
              onClick={() => handleBulkAction('audit')}
              disabled={isProcessing}
              className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" /> Run Crawler Audit
            </button>
            <button
              onClick={() => handleBulkAction('ai')}
              disabled={isProcessing}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" /> Generate Missing with AI
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={pages.length > 0 && selectedIds.size === pages.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">URL Path</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Metadata Status</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Images/Alt</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">AI Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(page.id)}
                      onChange={() => toggleSelect(page.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-indigo-600 dark:text-indigo-400">{page.path}</div>
                    {!page.is_published && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Draft</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        {page.title ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="truncate max-w-[12rem]" title={page.title || 'Missing Title'}>
                          {page.title || <span className="text-slate-400 italic">No Title</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {page.description ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="truncate max-w-[12rem]" title={page.description || 'Missing Description'}>
                           {page.description || <span className="text-slate-400 italic">No Description</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      {page.images_missing_alt > 0 ? (
                        <span className="text-amber-600 font-medium">{page.images_missing_alt} missing Alt</span>
                      ) : (
                        <span className="text-emerald-600">All Good</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {page.generated_by_ai ? (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Bot className="w-3.5 h-3.5" /> AI Generated
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Manual / Template</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500">
          <div>Showing 1 - {pages.length} of {totalCount}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1 border rounded hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
