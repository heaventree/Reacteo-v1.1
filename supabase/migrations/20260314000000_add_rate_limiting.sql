-- Rate Limiting System for AI Edge Functions
-- Implements per-user token bucket rate limiting

-- Table to track user API usage
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- 'ai-generate' or 'ai-audit'
  tokens_remaining INTEGER NOT NULL DEFAULT 100,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per user per endpoint
  UNIQUE(user_id, endpoint)
);

-- Index for faster lookups
CREATE INDEX idx_user_rate_limits_user_endpoint ON user_rate_limits(user_id, endpoint);
CREATE INDEX idx_user_rate_limits_window ON user_rate_limits(window_start);

-- Function to check and consume rate limit tokens
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_tokens INTEGER DEFAULT 100,
  p_refill_rate INTEGER DEFAULT 10, -- tokens per minute
  p_tokens_to_consume INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_record user_rate_limits%ROWTYPE;
  v_minutes_elapsed NUMERIC;
  v_tokens_to_add INTEGER;
  v_allowed BOOLEAN;
  v_retry_after INTEGER;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM user_rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- First request for this user/endpoint
    INSERT INTO user_rate_limits (user_id, endpoint, tokens_remaining)
    VALUES (p_user_id, p_endpoint, p_max_tokens - p_tokens_to_consume)
    RETURNING * INTO v_record;
    
    RETURN json_build_object(
      'allowed', TRUE,
      'tokens_remaining', v_record.tokens_remaining,
      'retry_after', 0
    );
  END IF;
  
  -- Calculate token refill based on elapsed time
  v_minutes_elapsed := EXTRACT(EPOCH FROM (NOW() - v_record.last_refill)) / 60.0;
  v_tokens_to_add := FLOOR(v_minutes_elapsed * p_refill_rate)::INTEGER;
  
  IF v_tokens_to_add > 0 THEN
    -- Refill tokens (cap at max)
    v_record.tokens_remaining := LEAST(
      v_record.tokens_remaining + v_tokens_to_add,
      p_max_tokens
    );
    v_record.last_refill := NOW();
  END IF;
  
  -- Check if request is allowed
  v_allowed := v_record.tokens_remaining >= p_tokens_to_consume;
  
  IF v_allowed THEN
    -- Consume tokens
    v_record.tokens_remaining := v_record.tokens_remaining - p_tokens_to_consume;
    v_retry_after := 0;
  ELSE
    -- Calculate retry-after in seconds
    v_retry_after := CEIL((p_tokens_to_consume - v_record.tokens_remaining)::NUMERIC / p_refill_rate * 60)::INTEGER;
  END IF;
  
  -- Update record
  UPDATE user_rate_limits
  SET 
    tokens_remaining = v_record.tokens_remaining,
    last_refill = v_record.last_refill,
    updated_at = NOW()
  WHERE user_id = p_user_id AND endpoint = p_endpoint;
  
  RETURN json_build_object(
    'allowed', v_allowed,
    'tokens_remaining', v_record.tokens_remaining,
    'retry_after', v_retry_after
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON user_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all rate limits
CREATE POLICY "Service role can manage rate limits"
  ON user_rate_limits
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON user_rate_limits TO service_role;
GRANT SELECT ON user_rate_limits TO authenticated;