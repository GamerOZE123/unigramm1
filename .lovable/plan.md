

# Communities / Groups Feature for University Hub

## Overview
Add a "Communities" section to the University Hub where students can create and join public, university-scoped group chats. Unlike the existing private chat groups (which require invitation), communities are discoverable and open -- any student at the same university can browse and join them.

## How It Differs from Existing Chat Groups
- **Existing chat groups** (in Chat page): Private, invite-only, no discovery
- **New communities** (in University Hub): Public, browsable, university-scoped, join freely

## Database

### New Table: `communities`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| name | text (NOT NULL) | Community name (max 50 chars) |
| description | text | What the community is about |
| avatar_url | text | Optional group image |
| university | text (NOT NULL) | Scoped to creator's university |
| created_by | uuid (NOT NULL) | Creator user ID |
| is_public | boolean | Default true |
| member_count | integer | Default 0, maintained by trigger |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### New Table: `community_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| community_id | uuid (FK) | References communities(id) ON DELETE CASCADE |
| user_id | uuid (NOT NULL) | Member |
| role | text | Default 'member' (admin/member) |
| joined_at | timestamptz | Default now() |
| UNIQUE | | (community_id, user_id) |

### New Table: `community_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| community_id | uuid (FK) | References communities(id) ON DELETE CASCADE |
| sender_id | uuid (NOT NULL) | Who sent |
| content | text (NOT NULL) | Message text |
| created_at | timestamptz | Default now() |

### Trigger: Auto-update `member_count`
On INSERT/DELETE on `community_members`, increment/decrement `communities.member_count`.

### RLS Policies
- **communities**: Authenticated can SELECT all public communities. INSERT if authenticated. UPDATE/DELETE only by creator.
- **community_members**: Authenticated can SELECT. INSERT own membership (user_id = auth.uid()). DELETE own membership or if community creator.
- **community_messages**: Members can SELECT (via subquery check). Members can INSERT. DELETE own messages.

## Frontend

### 1. University Hub Card
Add a "Communities" card to `University.tsx`:
- Icon: `Users` (from lucide)
- Color: `bg-emerald-500`
- Path: `/communities`
- Allowed for: `['student']`

### 2. New Route
Add `/communities` and `/communities/:communityId` routes in `App.tsx`.

### 3. New Page: `src/pages/Communities.tsx`
- **Browse tab**: Lists all public communities at the user's university with member count, description, and a Join/Joined button
- **My Communities tab**: Shows communities the user has joined
- **Create button**: Opens a modal to create a new community (name, description, optional avatar)
- Clicking a community navigates to `/communities/:communityId`

### 4. New Page: `src/pages/CommunityChat.tsx`
- Full chat interface similar to the existing group chat in Chat.tsx
- Header showing community name, member count, and a settings/members button
- Real-time message feed with sender avatars and names
- Message input bar at the bottom
- Members panel (slide-out or modal) showing all members
- Leave community button

### 5. New Hook: `src/hooks/useCommunities.ts`
- `fetchCommunities(university)` -- get all public communities for a university
- `fetchMyCommunities()` -- get communities user has joined
- `createCommunity(name, description)` -- create with user's university
- `joinCommunity(communityId)` -- insert into community_members
- `leaveCommunity(communityId)` -- delete from community_members

### 6. New Hook: `src/hooks/useCommunityMessages.ts`
- Modeled after `useGroupMessages.ts`
- `fetchMessages(communityId)` -- paginated, with sender profiles
- `sendMessage(communityId, content)` -- insert message
- Realtime subscription for new messages

### 7. New Components
- **`src/components/communities/CommunityCard.tsx`**: Card for browse list (name, description, member count, join button)
- **`src/components/communities/CreateCommunityModal.tsx`**: Modal with name, description fields
- **`src/components/communities/CommunityMembersPanel.tsx`**: Shows list of members with roles

## Files Created/Modified
- **New migration**: 3 tables + trigger + RLS policies
- **New**: `src/pages/Communities.tsx`
- **New**: `src/pages/CommunityChat.tsx`
- **New**: `src/hooks/useCommunities.ts`
- **New**: `src/hooks/useCommunityMessages.ts`
- **New**: `src/components/communities/CommunityCard.tsx`
- **New**: `src/components/communities/CreateCommunityModal.tsx`
- **New**: `src/components/communities/CommunityMembersPanel.tsx`
- **Modified**: `src/App.tsx` (add routes)
- **Modified**: `src/pages/University.tsx` (add card)
- **Modified**: `src/integrations/supabase/types.ts` (auto-updated)

