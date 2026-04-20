
DO $$
BEGIN
  -- Upload
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
  -- Update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can update images" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
  -- Delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
