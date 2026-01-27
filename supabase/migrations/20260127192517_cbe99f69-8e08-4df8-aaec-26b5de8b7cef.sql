-- Drop the problematic combined policy
DROP POLICY IF EXISTS "Users can manage their own tokens" ON device_tokens;

-- Create separate policies for each operation
CREATE POLICY "Users can insert their own tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);