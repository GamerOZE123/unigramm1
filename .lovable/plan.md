

# Confessions Feature for University Hub

## Overview
Add a "Confessions" section to the University Hub -- an anonymous posting board where students can share confessions. Unlike Ghost Chat (real-time chat), confessions are post-style cards with user tagging via `@mention`, reactions, and comment threads. All posts are anonymous but tagged users get clickable profile links.

## Database

### New Table: `confessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| user_id | uuid | Author (hidden from UI) |
| university | text | Scoped to same university |
| content | text | Confession text (supports @mentions) |
| created_at | timestamptz | Default now() |

### New Table: `confession_reactions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| confession_id | uuid (FK) | References confessions(id) ON DELETE CASCADE |
| user_id | uuid | Who reacted |
| emoji | text | Emoji used |
| created_at | timestamptz | Default now() |
| UNIQUE | | (confession_id, user_id, emoji) |

### New Table: `confession_comments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| confession_id | uuid (FK) | References confessions(id) ON DELETE CASCADE |
| user_id | uuid | Commenter (also anonymous) |
| content | text | Comment text |
| created_at | timestamptz | Default now() |

### RLS Policies
- All three tables: authenticated users can SELECT, INSERT
- DELETE own rows only (user_id = auth.uid())
- No UPDATE needed

## Frontend Changes

### 1. University Hub Card
Add a new option to the `universityOptions` array in `src/pages/University.tsx`:
- Title: "Confessions"
- Description: "Share anonymous confessions and tag people"
- Icon: `MessageSquareOff` (from lucide)
- Color: `bg-pink-500`
- Path: `/confessions`
- Allowed for: `['student']`

### 2. New Route
Add `/confessions` route in `src/App.tsx` pointing to a new `Confessions` page.

### 3. New Page: `src/pages/Confessions.tsx`
- Uses `Layout` wrapper
- Displays a feed of confession cards sorted by newest first
- "New Confession" button opens a modal
- Each confession shows: anonymous avatar, content (with clickable @mentions), time ago, reactions, comment count

### 4. New Hook: `src/hooks/useConfessions.ts`
Modeled after `useAnonymousChat.ts` but for post-style content:
- `fetchConfessions()` -- paginated, newest first, with reactions
- `createConfession(content)` -- inserts with university from profile
- `toggleReaction(confessionId, emoji)` -- same pattern as anonymous chat
- `addComment(confessionId, content)` -- insert comment
- `fetchComments(confessionId)` -- load comments for a confession
- Realtime subscription for new confessions and reactions

### 5. New Component: `src/components/confessions/ConfessionCard.tsx`
- Anonymous ghost avatar with pink accent
- Content text with @mentions parsed into clickable links (navigates to `/:username`)
- Time ago display
- Reaction buttons (same emoji set as Ghost Chat)
- Comment toggle to expand/collapse inline comments
- Comments are also anonymous

### 6. New Component: `src/components/confessions/CreateConfessionModal.tsx`
- Dialog/modal with a textarea
- Supports `@mention` for tagging users (reuses the user-search pattern from `MentionInput`)
- Only searches users (not startups/clubs) since confessions are personal
- Submit button posts the confession

### 7. Mention Rendering
In `ConfessionCard`, parse `@username` patterns in confession content and render them as clickable links styled with a highlight color, navigating to the tagged user's profile.

## Bug Fix
### `src/hooks/usePushNotifications.ts` TypeScript Error
Add `pushManager` to the ServiceWorkerRegistration type by declaring it in a `.d.ts` file or casting `registration as any` at the three usage points (lines 47, 118, 166). This fixes the existing build error.

## Files Created/Modified
- **New**: `src/pages/Confessions.tsx`
- **New**: `src/hooks/useConfessions.ts`
- **New**: `src/components/confessions/ConfessionCard.tsx`
- **New**: `src/components/confessions/CreateConfessionModal.tsx`
- **New**: Supabase migration (3 tables + RLS)
- **Modified**: `src/App.tsx` (add route)
- **Modified**: `src/pages/University.tsx` (add card)
- **Modified**: `src/hooks/usePushNotifications.ts` (fix TS error)
- **Modified**: `src/integrations/supabase/types.ts` (auto-updated)
