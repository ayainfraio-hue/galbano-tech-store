alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb,
  add column if not exists variants jsonb not null default '[]'::jsonb;

alter table public.order_items
  add column if not exists selected_options jsonb not null default '{}'::jsonb;

update public.products
set gallery_urls = jsonb_build_array(image_url)
where gallery_urls = '[]'::jsonb and coalesce(image_url, '') <> '';

create or replace function public.create_order(_customer_name text, _customer_phone text, _items jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order_id uuid;
  v_order_number bigint;
  v_name text := trim(coalesce(_customer_name, ''));
  v_phone text := regexp_replace(coalesce(_customer_phone, ''), '[^0-9]', '', 'g');
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_selected jsonb;
  v_variant jsonb;
  v_option text;
  v_total numeric(12,2) := 0;
  v_count integer := 0;
  v_lines jsonb := '[]'::jsonb;
begin
  if length(v_name) < 2 or length(v_name) > 100 then raise exception 'Informe um nome válido.'; end if;
  if v_phone !~ '^[1-9][0-9]{9,10}$' then raise exception 'Informe um telefone válido com DDD.'; end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) < 1 or jsonb_array_length(_items) > 100 then raise exception 'Carrinho vazio ou inválido.'; end if;

  for v_item in select value from jsonb_array_elements(_items)
  loop
    if coalesce(v_item->>'slug', '') = '' then raise exception 'Produto inválido no carrinho.'; end if;
    begin v_qty := (v_item->>'quantity')::integer;
    exception when others then raise exception 'Quantidade inválida.'; end;
    if v_qty < 1 or v_qty > 100 then raise exception 'Quantidade inválida.'; end if;

    select * into v_product from public.products where slug = v_item->>'slug' and active = true for share;
    if not found then raise exception 'Produto indisponível.'; end if;
    if v_product.stock < v_qty then raise exception 'Estoque insuficiente para %.', v_product.name; end if;

    v_selected := coalesce(v_item->'options', '{}'::jsonb);
    if jsonb_typeof(v_selected) <> 'object' then raise exception 'Opções inválidas para %.', v_product.name; end if;
    for v_variant in select value from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb))
    loop
      v_option := v_selected->>coalesce(v_variant->>'name', '');
      if v_option is null or not exists (
        select 1 from jsonb_array_elements_text(coalesce(v_variant->'options', '[]'::jsonb)) as allowed(value)
        where allowed.value = v_option
      ) then raise exception 'Selecione uma opção válida de % para %.', coalesce(v_variant->>'name', 'variação'), v_product.name; end if;
    end loop;

    v_total := v_total + (v_product.price * v_qty);
    v_count := v_count + v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('name', v_product.name, 'sku', v_product.sku, 'price', v_product.price, 'quantity', v_qty, 'options', v_selected));
  end loop;

  insert into public.orders(customer_name, customer_phone, items_count, total)
  values (v_name, v_phone, v_count, round(v_total, 2))
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select value from jsonb_array_elements(_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    v_selected := coalesce(v_item->'options', '{}'::jsonb);
    select * into v_product from public.products where slug = v_item->>'slug' and active = true;
    insert into public.order_items(order_id, product_id, product_name, sku, quantity, unit_price, subtotal, selected_options)
    values (v_order_id, v_product.id, v_product.name, v_product.sku, v_qty, v_product.price, v_product.price * v_qty, v_selected);
  end loop;

  return jsonb_build_object('order_number', v_order_number, 'customer_name', v_name, 'customer_phone', v_phone, 'total', round(v_total, 2), 'items', v_lines);
end;
$function$;
