
# Replace All Avatar Fallbacks with Custom Default Avatar Image

## What This Does

Everywhere in the app where a user has no profile picture, a gradient circle with a letter is shown. This plan replaces every single one of those fallbacks with your custom `/default-avatar.png` image.

## Files to Change (7 files)

| File | What Changes |
|------|-------------|
| `src/components/post/PostHeader.tsx` | Main post card avatar — replace letter fallback |
| `src/components/post/CommentItem.tsx` | Comment avatars in `InlineCommentSection` — replace Radix fallback |
| `src/components/post/CommentSection.tsx` | Comment section (post detail page) — both "your avatar" and comment list avatars |
| `src/components/post/NewCommentSection.tsx` | Alternative comment section — both inputs and comment list |
| `src/components/post/CreatePost.tsx` | "What's happening" box avatar — replace letter fallback |
| `src/components/layout/Sidebar.tsx` | Bottom-left logged-in user avatar — replace letter fallback |
| `src/components/layout/UsersSidebar.tsx` | Suggested users list — replace letter fallback |
| `src/components/layout/RightSidebar.tsx` | Random users list — replace letter fallback |

## Prerequisite

You must upload your custom image and name it `default-avatar.png`, placing it inside the `public/` folder of the project. This makes it available at the URL `/default-avatar.png` with no imports needed.

## The Change Pattern (Same Logic Applied Everywhere)

Every avatar block currently looks like this:

```
if avatar_url exists → show real photo
else → show gradient circle with first letter
```

After the change, it becomes:

```
<img
  src={avatar_url || '/default-avatar.png'}
  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
/>
```

The `onError` handler is a safety net — if a stored Supabase URL is broken or expired, the custom image still shows instead of a broken icon.

## Technical Details per File

### 1. PostHeader.tsx (lines 77–88)
Remove the `{displayAvatar ? ... : <span>letter</span>}` conditional. Replace with a single `<img>` using `src={displayAvatar || '/default-avatar.png'}` and an `onError` fallback. Remove the gradient background classes from the wrapper div.

### 2. CommentItem.tsx (lines 33–38)
The Radix `<AvatarImage>` already handles the `src`. Change its `src` to `comment.profiles?.avatar_url || '/default-avatar.png'`. Replace the `<AvatarFallback>` letter content with `<img src="/default-avatar.png" className="w-full h-full object-cover" />`.

### 3. CommentSection.tsx (lines 79–86 and 116–123)
Two avatar blocks — the logged-in user's avatar when typing a comment, and each comment's avatar in the list. Both get the same `<img src={url || '/default-avatar.png'} onError={...} />` pattern.

### 4. NewCommentSection.tsx (lines 169–172 and 202–205)
Same as CommentSection — two gradient blocks, both replaced with the image fallback pattern.

### 5. CreatePost.tsx (lines 61–65)
The avatar shown next to the "What's happening" textarea. This one currently doesn't even fetch the user's avatar — it just uses a letter. We update it to use `/default-avatar.png` directly since there's no avatar URL available in this component.

### 6. Sidebar.tsx (lines 177–184)
The bottom-left logged-in user info strip. Already has the `if avatar_url then img else span` pattern — just change the `else` to show the default image.

### 7. UsersSidebar.tsx (lines 71–78)
Suggested users list. Same pattern — change the fallback `<span>` to `<img src="/default-avatar.png" />`.

### 8. RightSidebar.tsx (lines 222–226)
Random users panel. Same pattern — the else block gets replaced with `<img src="/default-avatar.png" className="w-10 h-10 rounded-full object-cover" />`.

## Summary of the Rule

Anywhere you see:
```tsx
<span className="... font-bold text-white">
  {someName?.charAt(0) || 'U'}
</span>
```
inside a rounded avatar container — it becomes:
```tsx
<img src="/default-avatar.png" className="w-full h-full object-cover" alt="Default avatar" />
```

And the wrapper `div` has its gradient background classes removed since the image covers the entire area.
