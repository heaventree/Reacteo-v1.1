# Reacteo-v1.1 Scalability & Enterprise Roadmap

Based on the latest Architectural & QA Audit Report, the core application is Production Ready. This roadmap details the technical architecture for the next phase of enterprise scaling (10,000+ pages).

## 1. AI Edge Function Rate Limiting

### Objective
Prevent "runaway" API costs from authorized users by throttling requests to `ai-generate` and `ai-audit` Edge Functions.

### Technical Architecture
**Option A: Database-backed Rate Limiting (Recommended for zero-extra-dependencies)**
1. **Database Schema:** Create a `user_api_usage` table in Supabase tracking `user_id`, `endpoint`, `request_count`, and `window_start`.
2. **Edge Function Logic:** 
   - Before calling the AI provider, the Edge Function queries the usage table.
   - If `request_count` > `LIMIT` within the current hour/day, return `HTTP 429`.
   - Otherwise, increment the counter and proceed.

**Option B: Upstash Redis (Recommended for high-throughput)**
1. Connect Edge Functions to Upstash Redis via REST.
2. Use Redis `INCR` and `EXPIRE` commands to implement a highly performant sliding window rate limiter.

### Frontend Handling
Update `src/lib/ai/service.ts` to intercept `429` status codes and throw a specific `RateLimitError`. The UI will display a helpful countdown or warning toast to the user.

---

## 2. Enterprise Sitemap Architecture (Streaming & Indexing)

### Objective
Handle sitemap generation for 10,000 to 100,000+ pages without hitting the 50,000 URL / 50MB strict limits imposed by Google/Bing.

### Technical Architecture
**Phase 1: Build-Time Sitemap Indexing**
Update `scripts/generate-sitemap.ts`:
1. **Chunking Logic:** Query all pages from the database, split them into arrays of `MAX_URLS` (e.g., 40,000).
2. **File Generation:** 
   - Generate `public/sitemap-1.xml`, `public/sitemap-2.xml`, etc.
   - Generate a master `public/sitemap-index.xml` containing `<sitemap>` pointers to the chunked files.
3. **Robots.txt:** Update `robots.txt` to point to `sitemap-index.xml`.

**Phase 2: Dynamic Edge Streaming (If build times exceed 10 mins)**
1. Create a new Edge Function: `supabase/functions/serve-sitemap/index.ts`.
2. Map the `/sitemap.xml` route to this function via edge routing.
3. The function streams database rows directly to the HTTP response as XML chunks, completely removing build-time bottlenecks.

---

## Success Criteria
- [ ] AI functions successfully reject requests exceeding 50 requests/hour per user.
- [ ] UI gracefully handles `429` responses.
- [ ] Sitemap generator produces valid `sitemap-index.xml` when URLs > 40,000.