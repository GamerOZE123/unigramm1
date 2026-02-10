

## Fix: Reload Profiles Not Showing Previously Passed Users

### Problem
When clicking "Reload Profiles", the `fetchCandidates` function queries `dating_likes` and `dating_passes` tables and excludes all previously interacted users. Since those records still exist in the database, the reload returns an empty list.

### Solution
Add a `reloadCandidates` function to `useDatingCandidates.ts` that:
1. Deletes all of the current user's records from `dating_passes` (so passed profiles reappear)
2. Keeps `dating_likes` exclusions intact (you already liked them, no need to show again)
3. Calls `fetchCandidates` to re-fetch the now-available profiles

### File Changes

**`src/hooks/useDatingCandidates.ts`**
- Add a new `reloadCandidates` async function that:
  - Runs `DELETE FROM dating_passes WHERE from_user_id = user.id`
  - Then calls `fetchCandidates()`
- Export `reloadCandidates` alongside existing functions

**`src/pages/Dating.tsx`**
- Destructure the new `reloadCandidates` from the hook
- Pass `reloadCandidates` to `DatingCardStack`'s `onReload` prop instead of `fetchCandidates`

No other files need changes -- `DatingCardStack` already has the `onReload` prop wired up correctly.

