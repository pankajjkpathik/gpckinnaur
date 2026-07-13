
-- Defense-in-depth: deny all direct client access to the private 'assignments' bucket.
-- The app only accesses these files server-side via service_role and signed URLs,
-- both of which bypass storage.objects RLS. These policies close the door on any
-- direct anon/authenticated Data API access to the objects.

DROP POLICY IF EXISTS "assignments bucket deny select" ON storage.objects;
DROP POLICY IF EXISTS "assignments bucket deny insert" ON storage.objects;
DROP POLICY IF EXISTS "assignments bucket deny update" ON storage.objects;
DROP POLICY IF EXISTS "assignments bucket deny delete" ON storage.objects;

CREATE POLICY "assignments bucket deny select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id <> 'assignments');

CREATE POLICY "assignments bucket deny insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id <> 'assignments');

CREATE POLICY "assignments bucket deny update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id <> 'assignments')
  WITH CHECK (bucket_id <> 'assignments');

CREATE POLICY "assignments bucket deny delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id <> 'assignments');
