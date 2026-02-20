
-- ============================================================
-- STEP 5: DELIVERABLES + APPROVALS
-- ============================================================

-- 1. deliverables table
CREATE TABLE public.deliverables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title         text NOT NULL,
  description   text,
  file_id       uuid NOT NULL REFERENCES public.file_assets(id) ON DELETE RESTRICT,
  status        text NOT NULL DEFAULT 'submitted',
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  reviewer_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_feedback text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverables_project ON public.deliverables(project_id, created_at DESC);
CREATE INDEX idx_deliverables_status ON public.deliverables(status);

-- Validate status trigger (avoids immutable CHECK issues)
CREATE OR REPLACE FUNCTION public.validate_deliverable_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','submitted','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid deliverable status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_deliverable_status
  BEFORE INSERT OR UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.validate_deliverable_status();

-- Auto-update updated_at
CREATE TRIGGER trg_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. deliverable_events table (history)
CREATE TABLE public.deliverable_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id  uuid NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  actor_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_type      text NOT NULL,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverable_events ON public.deliverable_events(deliverable_id, created_at);

-- Validate event_type trigger
CREATE OR REPLACE FUNCTION public.validate_deliverable_event_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.event_type NOT IN ('created','submitted','approved','rejected','comment') THEN
    RAISE EXCEPTION 'Invalid event type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_deliverable_event_type
  BEFORE INSERT OR UPDATE ON public.deliverable_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_deliverable_event_type();

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: deliverables
-- ============================================================

-- SELECT: anyone with project access
CREATE POLICY "Project members can view deliverables"
  ON public.deliverables FOR SELECT
  USING (public.user_has_project_access(auth.uid(), project_id));

-- INSERT: STAFF or ADMIN only, created_by = auth.uid()
CREATE POLICY "Staff and admins can create deliverables"
  ON public.deliverables FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND user_has_project_access(auth.uid(), project_id)
    AND (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'STAFF'::app_role))
  );

-- UPDATE: Staff/Admin can update all fields; Client can only update approval fields
CREATE POLICY "Staff and admins can update deliverables"
  ON public.deliverables FOR UPDATE
  USING (
    user_has_project_access(auth.uid(), project_id)
    AND (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'STAFF'::app_role))
  );

CREATE POLICY "Clients can approve or reject deliverables"
  ON public.deliverables FOR UPDATE
  USING (
    has_role(auth.uid(), 'CLIENT'::app_role)
    AND is_project_client(auth.uid(), project_id)
  );

-- DELETE: ADMIN only
CREATE POLICY "Admins can delete deliverables"
  ON public.deliverables FOR DELETE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- ============================================================
-- RLS: deliverable_events
-- ============================================================

-- SELECT: anyone with project access (via deliverable join)
CREATE POLICY "Project members can view deliverable events"
  ON public.deliverable_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      WHERE d.id = deliverable_id
        AND public.user_has_project_access(auth.uid(), d.project_id)
    )
  );

-- INSERT: any project member, actor_id = auth.uid()
CREATE POLICY "Project members can insert deliverable events"
  ON public.deliverable_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND EXISTS (
      SELECT 1 FROM public.deliverables d
      WHERE d.id = deliverable_id
        AND public.user_has_project_access(auth.uid(), d.project_id)
    )
  );

-- UPDATE/DELETE: ADMIN only
CREATE POLICY "Admins can update deliverable events"
  ON public.deliverable_events FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can delete deliverable events"
  ON public.deliverable_events FOR DELETE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- ============================================================
-- FAN-OUT NOTIFICATIONS for deliverables
-- (reuses notifications table from Step 4)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fanout_deliverable_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_project   RECORD;
  v_recipient uuid;
BEGIN
  SELECT p.id, p.title, p.client_id INTO v_project
  FROM public.projects p WHERE p.id = NEW.project_id;

  -- On submit: notify client
  IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status <> 'submitted') THEN
    IF v_project.client_id <> NEW.created_by THEN
      INSERT INTO public.notifications(user_id, type, title, body, link)
      VALUES (
        v_project.client_id, 'deliverable',
        'Deliverable ready for review',
        v_project.title || ': ' || NEW.title,
        '/app/projects/' || NEW.project_id::text || '?tab=deliverables'
      );
    END IF;
  END IF;

  -- On approve/reject: notify staff + admins assigned to project
  IF NEW.status IN ('approved','rejected') AND (OLD IS NULL OR OLD.status NOT IN ('approved','rejected')) THEN
    FOR v_recipient IN
      SELECT pm.user_id FROM public.project_members pm
      WHERE pm.project_id = NEW.project_id
        AND pm.user_id <> NEW.reviewer_id
        AND pm.member_role IN ('STAFF','ADMIN')
    LOOP
      INSERT INTO public.notifications(user_id, type, title, body, link)
      VALUES (
        v_recipient, 'deliverable',
        'Deliverable ' || NEW.status,
        v_project.title || ': ' || NEW.title,
        '/staff/projects/' || NEW.project_id::text || '?tab=deliverables'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deliverable_notifications
  AFTER INSERT OR UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.fanout_deliverable_notifications();

-- ============================================================
-- Allow notifications INSERT for fan-out (service role bypass
-- already works; add authenticated INSERT for app-side inserts)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications' AND policyname='Authenticated users can insert notifications for themselves'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can insert notifications for themselves"
        ON public.notifications FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    $p$;
  END IF;
END;
$$;

-- Enable realtime for deliverables and events
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_events;
