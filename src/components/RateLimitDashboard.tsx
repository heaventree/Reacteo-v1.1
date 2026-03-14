import React, { useEffect, useState } from "react";
import { Zap, Clock, TrendingUp, AlertCircle } from "lucide-react";

interface RateLimitStatus {
  endpoint: string;
  tokensRemaining: number;
  maxTokens: number;
  refillRate: number;
  lastRefill: string;
  nextRefillIn: number;
}

export const RateLimitDashboard: React.FC = () => {
  const [status, setStatus] = useState<RateLimitStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRateLimitStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual Supabase query
      // This will query the user_rate_limits table
      const mockData: RateLimitStatus[] = [
        {
          endpoint: "ai-generate",
          tokensRemaining: 75,
          maxTokens: 100,
          refillRate: 10,
          lastRefill: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          nextRefillIn: 58,
        },
        {
          endpoint: "ai-audit",
          tokensRemaining: 42,
          maxTokens: 100,
          refillRate: 10,
          lastRefill: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          nextRefillIn: 55,
        },
      ];

      setStatus(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rate limit status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimitStatus();
    const interval = setInterval(fetchRateLimitStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (remaining: number, max: number): string => {
    const percentage = (remaining / max) * 100;
    if (percentage > 60) return "text-green-600 bg-green-50 border-green-200";
    if (percentage > 30) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getProgressBarColor = (remaining: number, max: number): string => {
    const percentage = (remaining / max) * 100;
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatEndpointName = (endpoint: string): string => {
    return endpoint
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading && status.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Rate Limits</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor your AI service usage and token availability
          </p>
        </div>
        <button
          onClick={fetchRateLimitStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {status.map((limit) => {
          const percentage = (limit.tokensRemaining / limit.maxTokens) * 100;
          const statusColor = getStatusColor(limit.tokensRemaining, limit.maxTokens);
          const progressColor = getProgressBarColor(limit.tokensRemaining, limit.maxTokens);

          return (
            <div
              key={limit.endpoint}
              className={`p-6 rounded-lg border-2 ${statusColor} transition-all`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {formatEndpointName(limit.endpoint)}
                </h3>
                <Zap className="w-6 h-6" />
              </div>

              <div className="space-y-4">
                {/* Token Count */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-3xl font-bold">
                      {limit.tokensRemaining}
                    </span>
                    <span className="text-sm opacity-75">
                      / {limit.maxTokens} tokens
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-current border-opacity-20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 opacity-75" />
                    <div>
                      <p className="text-xs opacity-75">Refill Rate</p>
                      <p className="text-sm font-semibold">
                        {limit.refillRate}/min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 opacity-75" />
                    <div>
                      <p className="text-xs opacity-75">Next Refill</p>
                      <p className="text-sm font-semibold">
                        {formatTimeRemaining(limit.nextRefillIn)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Warning */}
                {percentage < 30 && (
                  <div className="pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Low tokens remaining - requests may be rate limited
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How Rate Limits Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each AI request consumes 1 token from your available balance</li>
          <li>• Tokens automatically refill at 10 per minute (600 per hour)</li>
          <li>• Maximum capacity is 100 tokens per endpoint</li>
          <li>• Rate limits reset independently for each service</li>
        </ul>
      </div>
    </div>
  );
};