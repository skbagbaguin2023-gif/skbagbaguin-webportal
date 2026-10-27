update public.portal_records
set data = data - 'email' - 'contact'
where collection = 'council';
