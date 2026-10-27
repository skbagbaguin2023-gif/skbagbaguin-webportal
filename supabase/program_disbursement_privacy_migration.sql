update public.portal_records
set data = data - 'disbursedAmount' - 'disbursementBreakdown'
where collection = 'programs';
