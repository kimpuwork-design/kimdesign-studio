CREATE OR REPLACE FUNCTION public.reorder_project_gallery(p_project_id uuid, p_image_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_count integer; v_changed integer;
BEGIN
  PERFORM id FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project unavailable'; END IF;
  SELECT count(*) INTO v_count FROM public.portfolio_gallery WHERE project_id = p_project_id;
  IF p_image_ids IS NULL OR cardinality(p_image_ids) <> v_count OR
     (SELECT count(DISTINCT id) FROM unnest(p_image_ids) id) <> v_count OR
     EXISTS (SELECT 1 FROM unnest(p_image_ids) id WHERE NOT EXISTS (SELECT 1 FROM public.portfolio_gallery g WHERE g.id = id AND g.project_id = p_project_id)) THEN
    RAISE EXCEPTION 'Gallery changed. Reload before reordering.';
  END IF;
  UPDATE public.portfolio_gallery g SET sort_order = ordered.position - 1
  FROM unnest(p_image_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE g.id = ordered.id AND g.project_id = p_project_id;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> v_count THEN RAISE EXCEPTION 'Gallery order could not be saved'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.reorder_project_gallery(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_project_gallery(uuid, uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.replace_project_gallery_image(p_project_id uuid, p_image_id uuid, p_image_url text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_old_url text; v_cover text; v_changed integer;
BEGIN
  IF p_image_url IS NULL OR p_image_url NOT LIKE 'https://%' THEN RAISE EXCEPTION 'Invalid image URL'; END IF;
  SELECT thumbnail_url INTO v_cover FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project unavailable'; END IF;
  SELECT image_url INTO v_old_url FROM public.portfolio_gallery WHERE id = p_image_id AND project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Image unavailable'; END IF;
  UPDATE public.portfolio_gallery SET image_url = p_image_url WHERE id = p_image_id AND project_id = p_project_id;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> 1 THEN RAISE EXCEPTION 'Image replacement could not be saved'; END IF;
  IF v_cover = v_old_url THEN
    UPDATE public.projects SET thumbnail_url = p_image_url WHERE id = p_project_id;
    GET DIAGNOSTICS v_changed = ROW_COUNT;
    IF v_changed <> 1 THEN RAISE EXCEPTION 'Cover replacement could not be saved'; END IF;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.replace_project_gallery_image(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_project_gallery_image(uuid, uuid, text) TO authenticated, service_role;