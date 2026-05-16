## Findings

- The exact P0001 source is `public.create_notification(...)`:
  - It raises: `RAISE EXCEPTION 'Notification type % cannot be created from client', notification_type;`
  - With `notification_type = 'message'`, this becomes: `Notification type message cannot be created from client`.

- The failing path for DM sends is:
  ```text
  supabase.from('messages').insert(...)
    -> AFTER INSERT trigger: trigger_notify_message
    -> function: public.notify_message()
    -> calls public.create_notification(..., 'message', ...)
    -> create_notification sees auth.uid() from the original client insert
    -> raises P0001
  ```

- `sync_messages` is read-only for message fetching. It does not create notifications or write side effects.
- `get_or_create_conversation` does not create notifications. It creates/resurrects conversations and participants only.
- `messages` currently has this check constraint:
  ```sql
  CHECK (message_type = ANY (ARRAY['text', 'image', 'file', 'reply']))
  ```

## Plan

1. **Fix the broken notification trigger path**
   - Update `public.notify_message()` so it no longer calls `public.create_notification()` for auto-generated message notifications.
   - Keep the existing `trigger_notify_message` trigger in place.
   - Insert the notification directly from the trigger function as a trusted server-side side effect.
   - Add a safe `EXCEPTION WHEN others THEN RAISE WARNING ...; RETURN NEW;` block so notification failures cannot block the actual DM message insert again.
   - Add a `NOT EXISTS` guard to avoid duplicate message notifications when `handle_new_message()` has already inserted one in the same transaction.

2. **Keep `create_notification()` protected for direct client calls**
   - Do not loosen `create_notification()` to allow arbitrary client-created `message` notifications, because that would let authenticated users spoof message notifications to other users.
   - The fix will be isolated to the trusted message trigger path instead.

3. **Expand the `messages.message_type` check constraint**
   - Replace the current constraint with one that allows:
     ```text
     text, image, video, audio, shared_post, system, file
     ```
   - Preserve the currently allowed `reply` type too, so existing functionality does not regress:
     ```text
     text, image, video, audio, shared_post, system, file, reply
     ```

4. **Do not modify protected RPC behavior**
   - Leave `sync_messages` unchanged.
   - Leave `get_or_create_conversation` unchanged.
   - Do not change `message_type` defaults.
   - Do not remove existing triggers.