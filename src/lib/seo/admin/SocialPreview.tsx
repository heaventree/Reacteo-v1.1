import React, { useState } from 'react';
import { Globe, Twitter, Facebook } from 'lucide-react';

interface SocialPreviewProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  siteName?: string;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({
  title,
  description,
  url,
  imageUrl,
  siteName = 'MySite'
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'twitter' | 'facebook'>('google');

  // Fallbacks for empty states so the user always sees a structure
  const displayTitle = title || 'Your Page Title Goes Here';
  const displayDesc = description || 'Your meta description provides a concise summary of your page content. Keep it compelling and between 150-160 characters.';
  const displayUrl = url || 'https://yoursite.com/your-page-slug';
  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
  
  // Format domain for display
  const domain = React.useMemo(() => {
    try {
      return new URL(displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`).hostname;
    } catch {
      return 'yoursite.com';
    }
  }, [displayUrl]);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('google')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'google' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Globe className="w-4 h-4" /> Google
        </button>
        <button
          onClick={() => setActiveTab('twitter')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'twitter' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Twitter className="w-4 h-4" /> Twitter
        </button>
        <button
          onClick={() => setActiveTab('facebook')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'facebook' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Facebook className="w-4 h-4" /> Facebook
        </button>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
        {activeTab === 'google' && (
          <div className="w-full max-w-[600px] bg-white dark:bg-slate-950 p-4 rounded-lg shadow-sm">
            <div className="text-[14px] text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="truncate max-w-[280px] font-medium">{siteName}</span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
                  {displayUrl}
                </span>
              </div>
            </div>
            <h3 className="text-[20px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer mb-1 truncate pt-1">
              {displayTitle}
            </h3>
            <p className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
              {displayDesc}
            </p>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="w-full max-w-[500px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-[1.91/1] bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <img src={displayImage} alt="Twitter Card Preview" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#121212]">
              <div className="text-[15px] text-slate-500 dark:text-slate-400 mb-0.5">{domain}</div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">
                {displayTitle}
              </h3>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                {displayDesc}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'facebook' && (
          <div className="w-full max-w-[500px] bg-[#f0f2f5] dark:bg-slate-900 p-4 rounded-xl">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-[1.91/1] bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <img src={displayImage} alt="Facebook Shared Link Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-[#f2f3f5] dark:bg-[#1e1e1e]">
                <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {domain}
                </div>
                <h3 className="text-[16px] font-bold text-[#1d2129] dark:text-slate-100 line-clamp-2 mb-1 leading-tight">
                  {displayTitle}
                </h3>
                <p className="text-[14px] text-[#606770] dark:text-slate-400 line-clamp-1 leading-snug">
                  {displayDesc}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};