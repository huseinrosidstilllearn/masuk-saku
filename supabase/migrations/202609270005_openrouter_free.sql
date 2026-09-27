-- Preserve old ciphertext and encryption key. Legacy OpenAI rows are inactive until replaced.
alter table private.ai_credentials drop constraint ai_credentials_provider_check;
alter table private.ai_credentials add constraint ai_credentials_provider_check check(provider in ('openai','openrouter'));
alter table private.ai_credentials alter column provider set default 'openrouter';
alter table private.ai_credentials alter column model set default 'openrouter/free';
create or replace function public.store_ai_credential(p_household uuid,p_user uuid,p_ciphertext text,p_iv text,p_model text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_model is distinct from 'openrouter/free' then raise exception 'only OpenRouter free router allowed'; end if;
 insert into private.ai_credentials(household_id,user_id,provider,ciphertext,iv,model)
 values(p_household,p_user,'openrouter',p_ciphertext,p_iv,p_model)
 on conflict(household_id,user_id) do update set provider='openrouter',ciphertext=excluded.ciphertext,iv=excluded.iv,model=excluded.model,updated_at=now();
end $$;
drop function public.read_ai_credential(uuid,uuid);
create function public.read_ai_credential(p_household uuid,p_user uuid)
returns table(provider text,ciphertext text,iv text,model text) language sql security definer set search_path='' as $$
 select provider,ciphertext,iv,model from private.ai_credentials where household_id=p_household and user_id=p_user
$$;
revoke execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid) from public,anon,authenticated;
grant execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid) to service_role;
