

# Dating Mode ("Let's Discover") - Web Implementation Plan

## Summary
Build the Dating Mode feature as a standalone module within the existing Unigramm web app. The database (tables, RLS policies) is already fully set up from the mobile app -- no backend changes needed. This is purely a frontend implementation.

---

## Database (Already Done)
The following tables exist and have proper RLS policies:
- **dating_profiles** - user_id, gender, interested_in, looking_for, bio, images_json, prompts_json, is_active
- **dating_likes** - from_user_id, to_user_id
- **dating_passes** - from_user_id, to_user_id
- **dating_matches** - user1_id, user2_id
- **dating_messages** - match_id, sender_id, content, is_read

RLS enforces university-gating (same university filter on active profiles) and privacy on messages/matches.

---

## New Files to Create

### Pages (4 files)
1. **`src/pages/Dating.tsx`** - Main dating hub page with tab navigation between Discover / Matches / Profile Setup
2. **`src/pages/DatingSetup.tsx`** - Profile creation/edit form (photos, bio, gender, interested_in, looking_for, age)
3. **`src/pages/DatingDiscover.tsx`** - Card-based discovery with Like/Pass actions
4. **`src/pages/DatingChat.tsx`** - Match-specific chat page (`/dating/chat/:matchId`)

### Components (~10 files)
5. **`src/components/dating/DatingCard.tsx`** - Single candidate card with photo carousel (Instagram Stories-style tap navigation), bio, prompts display
6. **`src/components/dating/DatingCardStack.tsx`** - Stacked card container managing the deck of candidates
7. **`src/components/dating/MatchModal.tsx`** - "It's a Match!" celebration overlay with confetti (using existing canvas-confetti dependency)
8. **`src/components/dating/DatingMatchesList.tsx`** - Grid/list of matched users with avatars and last message preview
9. **`src/components/dating/DatingProfileForm.tsx`** - Form component for profile setup/edit (photo upload, bio, dropdowns)
10. **`src/components/dating/DatingProfilePreview.tsx`** - Preview card showing how profile looks to others
11. **`src/components/dating/DatingFilters.tsx`** - Age slider (18-24) and gender filter controls
12. **`src/components/dating/DatingChatWindow.tsx`** - Real-time messaging UI for a specific match
13. **`src/components/dating/DatingNavigation.tsx`** - Internal navigation bar for dating section (Discover / Matches / Profile)
14. **`src/components/dating/DatingLayout.tsx`** - Split-screen layout wrapper: sidebar (matches) + center (discover/chat) + optional right panel (filters)

### Hooks (3 files)
15. **`src/hooks/useDatingProfile.ts`** - Fetch/create/update own dating profile
16. **`src/hooks/useDatingCandidates.ts`** - Fetch candidates (batch of 20), like/pass actions, match detection
17. **`src/hooks/useDatingMatches.ts`** - Fetch matches list, real-time subscription to new matches and messages

---

## Routing Changes

Add to `src/App.tsx`:
```
/dating           -> Dating (main hub / discover)
/dating/setup     -> DatingSetup
/dating/discover  -> DatingDiscover
/dating/matches   -> Dating (matches tab)
/dating/chat/:matchId -> DatingChat
```
All wrapped in `<ProtectedRoute>`.

---

## Navigation Changes

- **Desktop Sidebar** (`Sidebar.tsx`): Add a "Dating" / "Discover" nav item with a Heart icon between existing nav items
- **Mobile Navigation** (`MobileNavigation.tsx`): Add Heart icon to the bottom nav bar (will become 6 items in the grid)

---

## Core Logic

### Discovery Flow
1. Fetch own dating_profile; if none exists, redirect to `/dating/setup`
2. Query `dating_profiles` joined with `profiles` (for name, avatar, university)
3. Client-side exclude already-liked and already-passed users (RLS handles university filter)
4. Apply client-side age/gender filters from DatingFilters
5. Display in card stack (batch of 20, prefetch next batch when 5 remain)

### Like/Pass Flow
- **Like**: Insert into `dating_likes`, then immediately query `dating_likes` to check if the other user also liked (mutual = match)
- **Pass**: Insert into `dating_passes`
- **Match detected**: Insert into `dating_matches`, show MatchModal with confetti

### Matching & Chat
- Subscribe to `dating_matches` via Supabase Realtime for new match notifications
- Subscribe to `dating_messages` filtered by match_id for real-time chat
- Mark messages as read by updating `is_read` on `dating_messages`

---

## UI/UX Design

### Theme
- Pink/Purple/Indigo gradient palette overlaid on the existing dark theme
- Glassmorphism cards with `backdrop-blur` and semi-transparent backgrounds
- Gradient accent: `from-pink-500 via-purple-500 to-indigo-500`

### Desktop Layout
- Left: Matches sidebar (list of matched users)
- Center: Discovery card stack or Chat window
- Right: Filter controls (collapsible)

### Mobile Layout
- Full-screen card view for discovery
- Swipe-like button interactions (Like/Pass buttons at bottom)
- Bottom sheet for filters

### Keyboard Shortcuts (Desktop)
- Arrow Left: Pass
- Arrow Right: Like
- Space: Next photo on current card

### Photo Navigation
- Tap left/right side of card image to navigate photos
- Progress dots at bottom of card image area

---

## Technical Details

### Image Upload
- Reuse existing `supabase.storage` upload pattern from `MultipleImageUpload` component
- Upload to a `dating-images` bucket (or reuse `post-images`)
- Store URLs in `images_json` JSONB column (array of strings)
- Max 5 photos enforced client-side

### Real-time Subscriptions
- `dating_matches` table: listen for INSERT where user1_id or user2_id = current user
- `dating_messages` table: listen for INSERT where match_id = current match

### State Management
- React Context (`DatingContext`) to hold:
  - Current dating profile
  - Candidates list
  - Active filters
  - Match notifications

---

## Implementation Order
1. Hooks (useDatingProfile, useDatingCandidates, useDatingMatches)
2. DatingProfileForm + DatingSetup page
3. DatingCard + DatingCardStack + DatingDiscover page
4. MatchModal with confetti
5. DatingMatchesList + DatingChatWindow + DatingChat page
6. DatingLayout (desktop split-screen)
7. Navigation updates (Sidebar + MobileNavigation)
8. Route registration in App.tsx
9. Keyboard shortcuts + photo navigation polish
10. DatingFilters component

