GRANT SELECT ON public.portfolio_gallery TO anon;
GRANT SELECT (id, project_id, category, original_name, mime_type, extension, size_bytes, version, sort_order, created_at, is_deleted) ON public.file_assets TO anon;
ALTER POLICY "Admins can view all gallery images" ON public.portfolio_gallery TO authenticated;
ALTER POLICY "Public can view gallery of published items" ON public.portfolio_gallery TO authenticated;
ALTER POLICY "Users with project access can view files" ON public.file_assets TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) TO authenticated;