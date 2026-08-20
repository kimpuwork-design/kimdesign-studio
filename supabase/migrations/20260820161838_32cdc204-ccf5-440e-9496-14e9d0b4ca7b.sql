REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_project_client(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) FROM authenticated;