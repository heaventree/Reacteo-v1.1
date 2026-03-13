import React, { useState } from 'react';
import { LayoutDashboard, Zap, FileText, Settings, Download, Search, Filter } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { SEO } from '../lib/seo';
import { AIModelsConfig } from '../components/AIModelsConfig';
import { BlogEditor } from '../components/BlogEditor';
import { SEOAuditReport } from '../components/SEOAuditReport';
import { useAIAudit } from '../lib/ai/hooks';
import type { AIModel } from '../lib/ai/types';

type AdminTab = 'overview' | 'models' | 'audit' | 'blog' | 'settings';

// --- Mock Data for Analytics ---
const mockTimelineData = [
  { date: 'Mar 1', score: 65 },
  { date: 'Mar 5', score: 72 },
  { date: 'Mar 10', score: 68 },
  { date: 'Mar 15', score: 85 },
  { date: 'Mar 20', score: 82 },
  { date: 'Mar 25', score: 90 },
  { date: 'Mar 30', score: 94 },
];

const mockDistributionData = [
  { name: 'Passed', value: 65, color: '#22c55e' },
  { name: 'Warnings', value: 25, color: '#eab308' },
  { name: 'Errors', value: 10, color: '#ef4444' },
];

const mockAudits = [
  { id: 1, path: '/home', score: 94, status: 'Good', date: '2026-03-30' },
  { id: 2, path: '/about', score: 85, status: 'Good', date: '2026-03-29' },
  { id: 3, path: '/blog/seo-tips', score: 72, status: 'Needs Improvement', date: '2026-03-28' },
  { id: 4, path: '/contact', score: 65, status: 'Poor', date: '2026-03-25' },
  { id: 5, path: '/pricing', score: 90, status: 'Good', date: '2026-03-20' },
];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [auditPagePath, setAuditPagePath] = useState('');
  const { auditPage, auditResult, auditing } = useAIAudit();

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  const handleRunAudit = async () => {
    if (!auditPagePath || !selectedModel) {
      alert('Please select a model and enter a page path');
      return;
    }

    try {
      await auditPage(auditPagePath, selectedModel.id);
    } catch (error) {
      console.error('Audit failed:', error);
    }
  };

  // --- Filtering Logic ---
  const filteredAudits = mockAudits.filter(audit => {
    const matchesSearch = audit.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScore = scoreFilter === 'all'
      ? true
      : scoreFilter === 'high' ? audit.score >= 80
      : scoreFilter === 'medium' ? audit.score >= 60 && audit.score < 80
      : audit.score < 60;
    return matchesSearch && matchesScore;
  });

  // --- CSV Export Logic ---
  const handleExportCSV = () => {
    const headers = ['ID', 'Path', 'Score', 'Status', 'Date'];
    const rows = filteredAudits.map(a => [a.id, a.path, a.score, a.status, a.date]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seo_audits_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Manage your SEO, AI models, and blog content"
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
                Admin Dashboard
              </h1>
              <span className="text-sm text-slate-600">
                {selectedModel ? `Using: ${selectedModel.name}` : 'No AI Model Selected'}
              </span>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-slate-200 mb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8 overflow-x-auto">
              {(
                [
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'models', label: 'AI Models', icon: Zap },
                  { id: 'audit', label: 'SEO Audit', icon: Settings },
                  { id: 'blog', label: 'Blog', icon: FileText },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition whitespace-nowrap ${
                    activeTab === id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-1">Total Pages Audited</p>
                  <p className="text-3xl font-bold text-slate-900">1,248</p>
                  <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
                </div>
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-1">Avg SEO Score</p>
                  <p className="text-3xl font-bold text-slate-900">84/100</p>
                  <p className="text-sm text-green-600 mt-2">↑ +4 points</p>
                </div>
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-1">Critical Errors</p>
                  <p className="text-3xl font-bold text-slate-900">12</p>
                  <p className="text-sm text-red-500 mt-2">Requires attention</p>
                </div>
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-1">Blog Posts</p>
                  <p className="text-3xl font-bold text-slate-900">45</p>
                  <p className="text-sm text-slate-500 mt-2">Active on site</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Chart */}
                <div className="lg:col-span-2 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-6">SEO Score Trend (30 Days)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockTimelineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-6">Audit Status Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockDistributionData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {mockDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table & Filters */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-semibold text-slate-900 text-lg">Recent Audits</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search paths..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                      />
                    </div>
                    
                    {/* Score Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={scoreFilter}
                        onChange={(e) => setScoreFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                      >
                        <option value="all">All Scores</option>
                        <option value="high">Good (80+)</option>
                        <option value="medium">Fair (60-79)</option>
                        <option value="low">Poor (&lt; 60)</option>
                      </select>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                        <th className="px-6 py-4">Page Path</th>
                        <th className="px-6 py-4">SEO Score</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Last Audited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredAudits.length > 0 ? (
                        filteredAudits.map((audit) => (
                          <tr key={audit.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{audit.path}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`font-semibold ${
                                audit.score >= 80 ? 'text-green-600' :
                                audit.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {audit.score}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                audit.score >= 80 ? 'bg-green-100 text-green-800' :
                                audit.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {audit.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{new Date(audit.date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                            No audits found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI Models Tab */}
          {activeTab === 'models' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <AIModelsConfig onModelSelected={setSelectedModel} />
            </div>
          )}

          {/* SEO Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Run SEO Audit</h2>

                {!selectedModel && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800">
                      Please configure and select an AI model first in the "AI Models" section
                    </p>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Model: {selectedModel?.name || 'Not selected'}
                    </label>
                    <button
                      onClick={() => setActiveTab('models')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Choose different model →
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Page Path
                    </label>
                    <input
                      type="text"
                      value={auditPagePath}
                      onChange={(e) => setAuditPagePath(e.target.value)}
                      placeholder="e.g., /blog/my-post or /about"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleRunAudit}
                    disabled={auditing || !selectedModel}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
                  >
                    {auditing ? 'Running Audit...' : 'Run Audit'}
                  </button>
                </div>

                {auditResult && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Audit Results</h3>
                    <SEOAuditReport result={auditResult} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blog Tab */}
          {activeTab === 'blog' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <BlogEditor />
            </div>
          )}
        </main>
      </div>
    </>
  );
};