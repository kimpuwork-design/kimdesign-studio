
-- ============================================================
-- message_threads: one per project
-- ============================================================
CREATE TABLE IF NOT EXISTS public.message_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id)
);

-- ============================================================
-- messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id          uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  body               text NOT NULL,
  attachment_file_id uuid REFERENCES public.file_assets(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_project_created ON public.messages(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created  ON public.messages(thread_id, created_at);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'message',
  title      text NOT NULL,
  body       text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications(user_id, is_read, created_at DESC);

-- notification type validation
CREATE OR REPLACE FUNCTION public.validate_notification_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('message','deliverable','system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_notification_type_trigger ON public.notifications;
CREATE TRIGGER validate_notification_type_trigger
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_notification_type();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- message_threads policies
CREATE POLICY "Project members can view threads"
  ON public.message_threads FOR SELECT
  USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Admins can update threads"
  ON public.message_threads FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can delete threads"
  ON public.message_threads FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- messages policies
CREATE POLICY "Project members can view messages"
  ON public.messages FOR SELECT
  USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.user_has_project_access(auth.uid(), project_id)
  );

CREATE POLICY "Admins can update messages"
  ON public.messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can delete messages"
  ON public.messages FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- notifications policies
CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT on notifications: handled exclusively by SECURITY DEFINER trigger
-- We allow direct insert only for the trigger function owner via the function below.
-- Regular users get no INSERT policy (trigger does fan-out for them).

-- ============================================================
-- Fan-out: insert notifications for all project members
-- except the sender, when a message is inserted.
-- Runs as SECURITY DEFINER to bypass RLS on notifications.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fanout_message_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project      RECORD;
  v_snippet      text;
  v_recipient_id uuid;
  v_role         text;
  v_link         text;
  v_sender_role  text;
BEGIN
  -- Load project + client
  SELECT p.id, p.title, p.client_id
  INTO v_project
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  -- Truncate body for snippet
  v_snippet := substring(NEW.body FROM 1 FOR 80);
  IF length(NEW.body) > 80 THEN v_snippet := v_snippet || '…'; END IF;

  -- Get sender role
  SELECT role::text INTO v_sender_role FROM public.profiles WHERE id = NEW.sender_id;

  -- Notify the client (if sender is not the client)
  IF v_project.client_id <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (
      v_project.client_id,
      'message',
      'New message on ' || v_project.title,
      v_snippet,
      '/app/projects/' || v_project.id::text || '?tab=messages'
    );
  END IF;

  -- Notify staff members assigned to this project
  FOR v_recipient_id IN
    SELECT pm.user_id
    FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id
      AND pm.user_id <> NEW.sender_id
      AND pm.member_role = 'STAFF'
  LOOP
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (
      v_recipient_id,
      'message',
      'New message on ' || v_project.title,
      v_snippet,
      '/staff/projects/' || v_project.id::text || '?tab=messages'
    );
  END LOOP;

  -- Notify admins assigned to this project (member_role='ADMIN')
  FOR v_recipient_id IN
    SELECT pm.user_id
    FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id
      AND pm.user_id <> NEW.sender_id
      AND pm.member_role = 'ADMIN'
  LOOP
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (
      v_recipient_id,
      'message',
      'New message on ' || v_project.title,
      v_snippet,
      '/admin/projects/' || v_project.id::text || '?tab=messages'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fanout_message_notifications ON public.messages;
CREATE TRIGGER trg_fanout_message_notifications
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.fanout_message_notifications();
