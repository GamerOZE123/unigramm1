

# Home Feed Algorithm Overhaul: Hybrid Scoring Architecture

## Current Problems

1. **+50 freshness bonus** dominates all other signals -- a 23-hour-old post with 0 engagement beats a 25-hour-old post with 500 likes
2. **Engagement formula** `raw/(raw+20)` saturates too fast -- 20 engagements scores 0.5, 200 engagements only scores 0.91 (barely different)
3. **State/country bonuses** are irrelevant for a university-focused app
4. **Impressions join** in the view adds query overhead; view penalty belongs on the client
5. **No engagement velocity** -- total likes matter but speed of engagement does not

## Proposed Architecture

```text
+-------------------------------------------+
|           SERVER (PostgreSQL View)         |
|                                            |
|  1. Engagement Velocity (log-based)        |
|  2. Recency Decay (exponential)            |
|  3. Social Proof (capped)                  |
|  4. Content Quality (media bonus)          |
|  5. Following Bonus                        |
|  6. University Bonus                       |
|  7. Major/Department Bonus (NEW)           |
|                                            |
|  Output: Top posts sorted by base_score    |
+-------------------------------------------+
                    |
                    v
+-------------------------------------------+
|          CLIENT (useHomePosts.ts)          |
|                                            |
|  1. View Penalty (score * 0.3 if seen)     |
|  2. Re-sort by adjusted score              |
|  3. Author diversity (max 2 consecutive)   |
|  4. Ad interleaving (every 5 posts)        |
|  5. Display top results                    |
+-------------------------------------------+
```

## Detailed Changes

### 1. Server-Side: New `ranked_posts` View

**Migration SQL** replaces the current view with:

**Engagement Velocity (35% weight)**
- Formula: `log(1 + (likes*1 + comments*2) / GREATEST(age_hours, 0.5)) * 35`
- Catches trending content early
- Logarithmic prevents runaway scores

**Recency Decay (25% weight)**
- Formula: `25 * exp(-age_hours / 24)`
- No flat +50 bonus -- purely exponential decay
- 24-hour half-life

**Social Proof (20% weight)**
- Formula: `LEAST((likes + comments) / 10.0, 50) * 0.4`
- Capped at 50 raw points (scaled to ~20 max)
- Validates quality independent of velocity

**Content Quality (10% weight)**
- `+10` if post has image(s)
- Simple media presence bonus

**Static Bonuses (10% weight)**
- Following: +8
- Same University: +5
- Same Major/Department: +3 (NEW -- replaces state/country)

**Removed from server:**
- Flat +50 freshness bonus (eliminated)
- State/country bonuses (eliminated)
- `post_impressions` join (moved to client) -- faster queries

### 2. Client-Side: Updated `useHomePosts.ts`

**View Penalty** (new logic in `prioritizeUnseenPosts`):
- Posts the user has already seen get `score * 0.3` (70% penalty)
- Unseen posts keep their full score
- Re-sort all posts by adjusted score after penalty

**Existing features preserved:**
- Author diversity (max 2 consecutive) -- already works
- Ad interleaving (every 5 posts) -- already works
- Infinite scroll and realtime updates -- already work

### Technical Details

**File: New Supabase migration**
- `DROP VIEW IF EXISTS ranked_posts`
- `CREATE OR REPLACE VIEW ranked_posts AS ...` with the new scoring formula
- Removes `post_impressions` join from the view
- Adds `major` column output for client use
- Replaces state/country joins with major comparison

**File: `src/hooks/useHomePosts.ts`**
- Update `prioritizeUnseenPosts` to apply `score * 0.3` penalty to seen posts instead of just reordering
- Add re-sort by adjusted score after penalty
- Remove the "reloop" reset logic (view penalty handles recycling gracefully)
- Keep all existing diversity, ad, and scroll logic

**No other files change** -- `Home.tsx` and `PostCard` consume the same data shape.

### Score Examples (New Formula)

| Post | Age | Likes | Comments | Has Image | Velocity | Recency | Social | Quality | Total |
|------|-----|-------|----------|-----------|----------|---------|--------|---------|-------|
| Viral new | 1h | 50 | 10 | Yes | 56 | 24 | 2.4 | 10 | ~92 |
| Moderate new | 3h | 10 | 3 | Yes | 30 | 22 | 0.5 | 10 | ~63 |
| Popular old | 48h | 200 | 50 | No | 10 | 3 | 20 | 0 | ~33 |
| Fresh empty | 0.5h | 0 | 0 | No | 0 | 25 | 0 | 0 | ~25 |
| Seen viral | 1h | 50 | 10 | Yes | - | - | - | - | ~28 (x0.3) |

Key improvement: A fresh post with zero engagement (25 pts) no longer beats a 48-hour post with 250 engagements (33 pts). The old system gave the fresh post 51+ points via the flat bonus.

