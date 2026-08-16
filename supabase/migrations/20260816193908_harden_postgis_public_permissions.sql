revoke insert,update,delete,truncate,references,trigger on table public.spatial_ref_sys from anon,authenticated;
revoke execute on function public.st_estimatedextent(text,text) from anon,authenticated;
revoke execute on function public.st_estimatedextent(text,text,text) from anon,authenticated;
revoke execute on function public.st_estimatedextent(text,text,text,boolean) from anon,authenticated;
