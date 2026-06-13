
-- Lock down all SECURITY DEFINER trigger/helper functions — none should be API-callable
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fanout_deliverable_notifications() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fanout_message_notifications() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fanout_quote_notifications() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fanout_invoice_notifications() FROM anon, authenticated, PUBLIC;
