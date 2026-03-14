import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export interface RateLimitStatus {
  endpoint: string;
  tokensRemaining: number;
  maxTokens: number;
  refillRate: number;
  lastRefill: string;
  nextRefillIn: number;
}

export function useRateLimits() {
  const [status, setStatus] = useState<RateLimitStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRateLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // User not authenticated - show mock data for demo
        const mockData: RateLimitStatus[] = [
          {
            endpoint: 'ai-generate',
            tokensRemaining: 75,
            maxTokens: 100,
            refillRate: 10,
            lastRefill: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            nextRefillIn: 58,
          },
          {
            endpoint: 'ai-audit',
            tokensRemaining: 42,
            maxTokens: 100,
            refillRate: 10,
            lastRefill: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            nextRefillIn: 55,
          },
        ];
        setStatus(mockData);
        setLoading(false);
        return;
      }

      // Fetch rate limits from database
      const { data, error: fetchError } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Transform database records to UI format
      const transformedData: RateLimitStatus[] = (data || []).map((record) => {
        const now = new Date();
        const lastRefill = new Date(record.last_refill);
        const secondsSinceRefill = Math.floor((now.getTime() - lastRefill.getTime()) / 1000);
        const nextRefillIn = Math.max(0, 60 - (secondsSinceRefill % 60));

        return {
          endpoint: record.endpoint,
          tokensRemaining: record.tokens_remaining,
          maxTokens: 100, // From migration default
          refillRate: 10, // From migration default
          lastRefill: record.last_refill,
          nextRefillIn,
        };
      });

      // Ensure both endpoints are present (create placeholder if missing)
      const endpoints = ['ai-generate', 'ai-audit'];
      const result: RateLimitStatus[] = endpoints.map((endpoint) => {
        const existing = transformedData.find((d) => d.endpoint === endpoint);
        return existing || {
          endpoint,
          tokensRemaining: 100,
          maxTokens: 100,
          refillRate: 10,
          lastRefill: new Date().toISOString(),
          nextRefillIn: 60,
        };
      });

      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rate limit status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
    const interval = setInterval(fetchRateLimits, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { status, loading, error, refresh: fetchRateLimits };
}