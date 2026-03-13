import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, FileText, Share2, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useBlogPost, useBlogValidation } from '../lib/ai/hooks';
import { BlogService } from '../lib/ai/blog';
import type { BlogPost } from '../lib/ai/types';
import { SocialPreview } from '../lib/seo/admin/SocialPreview';
import { analyzeContent, type SEOAnalysisResult } from '../lib/seo/utils/analyzer';

interface BlogEditorProps {
  slug?: string;
  onSave?: (post: BlogPost) => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ slug, onSave }) => {
  const { post, loading, createPost, updatePost } = useBlogPost(slug);
  const { validationResult, validate } = useBlogValidation();
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    tags: [],
    category: '',
    published: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    wordCount: 0,
    readingTime: 0,
  });
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'social' | 'preview'>('editor');
  const [analysis, setAnalysis] = useState<SEOAnalysisResult | null>(null);

  useEffect(() => {
    if (post) {
      setFormData(post);
      if (post.content) {
        setAnalysis(analyzeContent(post.content, post.seoKeywords || '', window.location.hostname));
      }
    }
  }, [post]);

  const handleFieldChange = (field: keyof BlogPost, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Update analysis if content or keywords change
      if (field === 'content' || field === 'seoKeywords') {
         const kw = field === 'seoKeywords' ? value as string : prev.seoKeywords;
         const content = field === 'content' ? value as string : prev.content;
         setAnalysis(analyzeContent(content || '', kw || '', window.location.hostname));
      }
      return updated;
    });

    // Auto-update slugs and counts
    if (field === 'title' && !slug) {
      setFormData((prev) => ({
        ...prev,
        slug: BlogService.slugify(value as string),
      }));
    }

    if (field === 'content') {
      const wordCount = BlogService.calculateWordCount(value as string);
      const readingTime = BlogService.calculateReadingTime(value as string);
      setFormData((prev) => ({
        ...prev,
        wordCount,
        readingTime,
        excerpt: prev.excerpt || BlogService.generateExcerpt(value as string),
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSave = async () => {
    try {
      // Validate SEO
      const validation = validate(formData);
      if (!validation.valid) {
        alert('Please fix SEO issues before saving');
        setActiveTab('seo');
        return;
      }

      if (slug && post?.id) {
        await updatePost(post.id, formData);
      } else {
        await createPost(formData);
      }

      onSave?.(formData);
      alert('Blog post saved successfully!');
    } catch (error) {
      alert('Failed to save blog post');
      console.error(error);
    }
  };

  const handleValidate = () => {
    validate(formData);
    setActiveTab('seo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          {slug ? 'Edit Blog Post' : 'Create Blog Post'}
        </h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Post'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['editor', 'seo', 'social', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'social' && <Share2 className="w-4 h-4" />}
            {tab === 'seo' && <Activity className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Blog post title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                placeholder="blog-post-slug"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Author
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                placeholder="Author name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                placeholder="Category"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleFieldChange('excerpt', e.target.value)}
              placeholder="Brief summary of the post"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Content *
              </label>
              {analysis && (
                <div className="flex gap-4 text-xs">
                  <span className={analysis.wordCount > 300 ? 'text-green-600' : 'text-amber-600'}>
                    {analysis.wordCount} words
                  </span>
                  <span className="text-slate-500">{analysis.readingTime} min read</span>
                  <span className={analysis.fleschKincaid >= 60 ? 'text-green-600' : 'text-amber-600'}>
                    Reading Ease: {analysis.fleschKincaid}
                  </span>
                </div>
              )}
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Write your blog post content here..."
              rows={15}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag and press Enter"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Publish */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => handleFieldChange('published', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-slate-700">
              Publish this post
            </label>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {validationResult && (
                <div
                  className={`p-4 border rounded-lg ${
                    validationResult.valid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      {validationResult.issues.length > 0 && (
                        <div>
                          <p className="font-semibold text-red-900 mb-2">Issues:</p>
                          <ul className="space-y-1">
                            {validationResult.issues.map((issue, i) => (
                              <li key={i} className="text-sm text-red-800">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validationResult.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-yellow-900 mb-2">Warnings:</p>
                          <ul className="space-y-1">
                            {validationResult.warnings.map((warning, i) => (
                              <li key={i} className="text-sm text-yellow-800">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SEO Title (30-60 chars)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => handleFieldChange('seoTitle', e.target.value)}
                      placeholder="Optimized page title"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500">
                      {formData.seoTitle.length}/60
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SEO Description (120-160 chars)
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => handleFieldChange('seoDescription', e.target.value)}
                      placeholder="Meta description for search engines"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 bottom-2.5 text-xs text-slate-500">
                      {formData.seoDescription.length}/160
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Focus Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords}
                    onChange={(e) => handleFieldChange('seoKeywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleValidate}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Validate SEO via AI
              </button>
            </div>
            
            {/* Right side: Metrics Charts */}
            <div className="space-y-6">
              {analysis ? (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm h-full">
                  <h3 className="font-semibold text-slate-800 mb-6 text-center text-lg">Real-time Content Performance</h3>
                  
                  <div className="h-64 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Readability', score: analysis.fleschKincaid, fullMark: 100 },
                        { subject: 'Word Count', score: Math.min((analysis.wordCount / 1000) * 100, 100), fullMark: 100 },
                        { subject: 'KW Density', score: Math.min((analysis.keywordDensity / 2.5) * 100, 100), fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" textAnchor="middle" tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                        <Radar name="Score" dataKey="score" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <h4 className="text-sm font-bold text-slate-700 mb-4 text-center border-t pt-4">Link Usage Breakdown</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Internal Links', count: analysis.internalLinks },
                        { name: 'External Links', count: analysis.externalLinks }
                      ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                           cursor={{ fill: '#e2e8f0' }}
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-500">
                  <Activity className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">Add content and keywords<br/>to see performance metrics</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Social Sharing Preview</h3>
            <p className="text-sm text-slate-600 mb-4">
              See exactly how your post will look when shared on Google, Twitter, and Facebook.
            </p>
            <SocialPreview
              title={formData.seoTitle || formData.title}
              description={formData.seoDescription || formData.excerpt}
              url={`https://${window.location.hostname}/${formData.slug}`}
              siteName="My React App"
            />
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-slate-200">
          <h1>{formData.title}</h1>
          <p className="text-slate-600">
            By {formData.author || 'Unknown'} • {formData.readingTime} min read
          </p>
          <div className="whitespace-pre-wrap text-slate-700">{formData.content}</div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
              {formData.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
