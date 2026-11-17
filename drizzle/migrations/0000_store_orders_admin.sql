-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.admin_emails (
  email text PRIMARY KEY
);
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_emails (email) VALUES ('admin@galbano.com.br');

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin' FROM auth.users u JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
ON CONFLICT DO NOTHING;

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ===== Products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  sku text NOT NULL UNIQUE,
  category text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  old_price numeric(12,2) CHECK (old_price IS NULL OR old_price >= 0),
  rating numeric(2,1) NOT NULL DEFAULT 5,
  reviews integer NOT NULL DEFAULT 0,
  badge text,
  tags text[] NOT NULL DEFAULT '{}',
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock integer NOT NULL DEFAULT 3 CHECK (min_stock >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Orders =====
CREATE SEQUENCE public.order_number_seq START 1001;
GRANT USAGE ON SEQUENCE public.order_number_seq TO service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint NOT NULL UNIQUE DEFAULT nextval('public.order_number_seq'),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  total numeric(12,2) NOT NULL DEFAULT 0,
  items_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo','Em atendimento','Aguardando pagamento','Pago','Enviado','Concluído','Cancelado')),
  stock_deducted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Stock movements =====
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada','saida','venda','estorno')),
  quantity integer NOT NULL CHECK (quantity > 0),
  reason text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_idx ON public.stock_movements(product_id, created_at DESC);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add manual stock movements" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND type IN ('entrada','saida') AND order_id IS NULL);

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_stock integer;
  product_label text;
BEGIN
  SELECT stock, name INTO current_stock, product_label FROM public.products WHERE id = NEW.product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  IF NEW.type IN ('entrada','estorno') THEN
    UPDATE public.products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
  ELSE
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": disponível %, necessário %', product_label, current_stock, NEW.quantity;
    END IF;
    UPDATE public.products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
  END IF;
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stock_movements_apply BEFORE INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item record;
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('Pago','Enviado','Concluído') AND NOT OLD.stock_deducted THEN
      FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
        INSERT INTO public.stock_movements (product_id, type, quantity, reason, order_id)
        VALUES (item.product_id, 'venda', item.quantity, 'Pedido #' || NEW.order_number || ' pago', NEW.id);
      END LOOP;
      NEW.stock_deducted := true;
    ELSIF NEW.status = 'Cancelado' AND OLD.stock_deducted THEN
      FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
        INSERT INTO public.stock_movements (product_id, type, quantity, reason, order_id)
        VALUES (item.product_id, 'estorno', item.quantity, 'Pedido #' || NEW.order_number || ' cancelado', NEW.id);
      END LOOP;
      NEW.stock_deducted := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_status_change BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change();

CREATE OR REPLACE FUNCTION public.create_order(_customer_name text, _customer_phone text, _items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  clean_name text := btrim(coalesce(_customer_name, ''));
  clean_phone text := regexp_replace(coalesce(_customer_phone, ''), '\D', '', 'g');
  new_order public.orders;
  entry jsonb;
  prod public.products;
  qty integer;
  order_total numeric(12,2) := 0;
  order_count integer := 0;
  result_items jsonb := '[]'::jsonb;
BEGIN
  IF length(clean_name) < 2 OR length(clean_name) > 100 THEN
    RAISE EXCEPTION 'Informe um nome válido';
  END IF;
  IF length(clean_phone) < 10 OR length(clean_phone) > 13 THEN
    RAISE EXCEPTION 'Informe um telefone válido com DDD';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Carrinho vazio ou inválido';
  END IF;

  INSERT INTO public.orders (customer_name, customer_phone) VALUES (clean_name, clean_phone) RETURNING * INTO new_order;

  FOR entry IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (entry->>'quantity')::integer;
    IF qty IS NULL OR qty < 1 OR qty > 99 THEN
      RAISE EXCEPTION 'Quantidade inválida';
    END IF;
    SELECT * INTO prod FROM public.products WHERE slug = entry->>'slug' AND active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto indisponível: %', entry->>'slug';
    END IF;
    INSERT INTO public.order_items (order_id, product_id, product_name, sku, unit_price, quantity, subtotal)
    VALUES (new_order.id, prod.id, prod.name, prod.sku, prod.price, qty, round(prod.price * qty, 2));
    order_total := order_total + round(prod.price * qty, 2);
    order_count := order_count + qty;
    result_items := result_items || jsonb_build_object('name', prod.name, 'sku', prod.sku, 'price', prod.price, 'quantity', qty);
  END LOOP;

  UPDATE public.orders SET total = order_total, items_count = order_count WHERE id = new_order.id;

  RETURN jsonb_build_object(
    'order_number', new_order.order_number,
    'customer_name', clean_name,
    'customer_phone', clean_phone,
    'total', order_total,
    'created_at', new_order.created_at,
    'items', result_items
  );
END;
$$;
REVOKE ALL ON FUNCTION public.create_order(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, jsonb) TO anon, authenticated;

-- ===== Product images storage policies (private bucket; admins create long-lived signed links) =====
CREATE POLICY "Admins read product images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.products (slug, name, brand, sku, category, image_url, price, old_price, rating, reviews, badge, tags, short_description, description, specs, stock, min_stock, sort_order) VALUES
('smartphone-aurum-x-pro-256gb', 'Smartphone Aurum X Pro 256GB 5G Tela 6.7" Câmera Tripla 50MP Grafite', 'Aurum', 'GT-1001', 'smartphones', '/__l5e/assets-v1/a9a6627b-d9fd-4e1b-bc5a-2ae5cc6409e6/smartphone.jpg', 5499, 6999, 4.9, 312, 'Black November', ARRAY['oferta','destaque','mais-vendido']::text[], 'Desempenho de ponta, tela AMOLED 120Hz e câmera tripla profissional.', 'O Aurum X Pro combina design em titânio grafite, tela AMOLED de 6.7" com 120Hz e um conjunto de câmeras triplas de 50MP para fotos incríveis de dia e de noite. Bateria para o dia todo com carregamento rápido de 65W.', '[["Tela","6.7\" AMOLED 120Hz"],["Armazenamento","256GB"],["Memória RAM","12GB"],["Câmera traseira","50MP + 48MP + 12MP"],["Bateria","5.000 mAh, carga 65W"],["Conectividade","5G, Wi-Fi 7, NFC"]]'::jsonb, 25, 3, 0),
('smartphone-aurum-x-128gb', 'Smartphone Aurum X 128GB 5G Tela 6.4" Câmera Dupla 50MP Grafite', 'Aurum', 'GT-1002', 'smartphones', '/__l5e/assets-v1/a9a6627b-d9fd-4e1b-bc5a-2ae5cc6409e6/smartphone.jpg', 3299, 3899, 4.7, 188, NULL, ARRAY['oferta','mais-vendido']::text[], 'O equilíbrio perfeito entre potência e preço.', 'Versão compacta da linha Aurum X, com 5G, tela de 6.4" e câmera dupla de 50MP. Ideal para quem quer performance premium com excelente custo-benefício.', '[["Tela","6.4\" AMOLED 90Hz"],["Armazenamento","128GB"],["Memória RAM","8GB"],["Câmera traseira","50MP + 12MP"],["Bateria","4.500 mAh"],["Conectividade","5G, Wi-Fi 6"]]'::jsonb, 12, 3, 1),
('notebook-nexa-book-14-i7-16gb', 'Notebook Nexa Book 14" Intel Core i7 16GB SSD 512GB Tela Full HD Prata', 'Nexa', 'GT-2001', 'notebooks', '/__l5e/assets-v1/11824c14-f10c-4d69-8925-3816ee3ac8b1/notebook.jpg', 5899, 6799, 4.8, 154, 'Mais vendido', ARRAY['oferta','destaque','mais-vendido']::text[], 'Leve, rápido e com bateria para o dia todo.', 'O Nexa Book 14 é ultrafino, com corpo em alumínio, processador Intel Core i7 e SSD de 512GB. Perfeito para trabalho, estudos e produtividade em qualquer lugar.', '[["Processador","Intel Core i7 13ª geração"],["Memória RAM","16GB DDR5"],["Armazenamento","SSD 512GB NVMe"],["Tela","14\" Full HD IPS"],["Peso","1,3 kg"],["Sistema","Windows 11"]]'::jsonb, 8, 3, 2),
('notebook-nexa-book-15-i5-8gb', 'Notebook Nexa Book 15" Intel Core i5 8GB SSD 256GB Tela Full HD Prata', 'Nexa', 'GT-2002', 'notebooks', '/__l5e/assets-v1/11824c14-f10c-4d69-8925-3816ee3ac8b1/notebook.jpg', 3699, 4199, 4.6, 97, NULL, ARRAY['oferta']::text[], 'Produtividade essencial com tela ampla.', 'Notebook de 15" com processador Intel Core i5, ideal para tarefas do dia a dia, estudos e home office.', '[["Processador","Intel Core i5 12ª geração"],["Memória RAM","8GB"],["Armazenamento","SSD 256GB"],["Tela","15.6\" Full HD"],["Sistema","Windows 11"]]'::jsonb, 30, 3, 3),
('headphone-pulse-anc-900', 'Headphone Bluetooth Pulse ANC 900 com Cancelamento de Ruído Preto', 'Pulse', 'GT-3001', 'audio', '/__l5e/assets-v1/9e886804-4942-4730-87db-7b97aa60d849/headphone.jpg', 1299, 1699, 4.8, 421, '-24%', ARRAY['oferta','destaque','mais-vendido']::text[], 'Silêncio absoluto e som de estúdio por até 40 horas.', 'Cancelamento ativo de ruído adaptativo, drivers de 40mm e até 40 horas de bateria. Conforto premium com almofadas em couro sintético.', '[["Conexão","Bluetooth 5.3"],["Bateria","Até 40h"],["Cancelamento de ruído","Ativo adaptativo"],["Drivers","40mm"],["Peso","250g"]]'::jsonb, 15, 3, 4),
('fone-pulse-buds-pro', 'Fone de Ouvido Sem Fio Pulse Buds Pro TWS com Estojo de Carga Branco', 'Pulse', 'GT-3002', 'audio', '/__l5e/assets-v1/3c2a979b-cd83-430f-99a2-0175f7b062cf/fone-tws.jpg', 599, 799, 4.7, 603, NULL, ARRAY['oferta','mais-vendido','lancamento']::text[], 'Compacto, com cancelamento de ruído e áudio espacial.', 'Fones true wireless com cancelamento de ruído, modo ambiente e até 30 horas com o estojo. Resistentes a respingos (IPX4).', '[["Conexão","Bluetooth 5.3"],["Bateria","6h + 24h no estojo"],["Resistência","IPX4"],["Recursos","ANC e modo ambiente"]]'::jsonb, 6, 3, 5),
('caixa-de-som-voltix-boom-360', 'Caixa de Som Bluetooth Voltix Boom 360 à Prova d''Água 40W Preta', 'Voltix', 'GT-3003', 'audio', '/__l5e/assets-v1/24705425-61ee-4c83-a032-98bb55a15dc4/caixa-de-som.jpg', 899, 1099, 4.6, 276, NULL, ARRAY['oferta','destaque','lancamento']::text[], 'Som 360° potente para levar a qualquer lugar.', 'Caixa de som portátil com 40W de potência, som 360° e graves profundos. À prova d''água (IP67) e bateria para até 20 horas.', '[["Potência","40W RMS"],["Bateria","Até 20h"],["Resistência","IP67"],["Conexão","Bluetooth 5.3"]]'::jsonb, 18, 3, 6),
('smartwatch-orbit-watch-s', 'Smartwatch Orbit Watch S 45mm GPS Monitor Cardíaco Pulseira Preta', 'Orbit', 'GT-4001', 'smartwatches', '/__l5e/assets-v1/7835747d-89da-45dc-9cca-6eed6b006508/smartwatch.jpg', 1599, 1999, 4.7, 233, 'Lançamento', ARRAY['lancamento','destaque','oferta']::text[], 'Saúde, treino e notificações direto no pulso.', 'Tela AMOLED always-on, GPS integrado, monitor de frequência cardíaca, oxigenação e sono. Mais de 100 modos esportivos.', '[["Tela","1.9\" AMOLED"],["Caixa","45mm alumínio"],["Bateria","Até 7 dias"],["Resistência","5 ATM"],["Sensores","GPS, cardíaco, SpO2"]]'::jsonb, 2, 3, 7),
('smart-tv-lumen-65-4k', 'Smart TV Lumen 65" 4K UHD QLED HDR10+ Wi-Fi Comando de Voz', 'Lumen', 'GT-5001', 'tv-e-video', '/__l5e/assets-v1/eb279dc6-df9c-4924-a585-99c590373980/smart-tv.jpg', 4299, 5499, 4.8, 189, 'Black November', ARRAY['oferta','destaque','mais-vendido']::text[], 'Cores vivas em 4K com tecnologia QLED.', 'Imagem 4K com pontos quânticos, HDR10+ e taxa de 120Hz. Sistema smart com os principais apps de streaming e comando de voz.', '[["Tela","65\" QLED 4K"],["Taxa de atualização","120Hz"],["HDR","HDR10+, HLG"],["Conexões","4x HDMI 2.1, 2x USB"],["Smart","Wi-Fi, Bluetooth, voz"]]'::jsonb, 10, 3, 8),
('smart-tv-lumen-50-4k', 'Smart TV Lumen 50" 4K UHD LED HDR Wi-Fi Bluetooth', 'Lumen', 'GT-5002', 'tv-e-video', '/__l5e/assets-v1/eb279dc6-df9c-4924-a585-99c590373980/smart-tv.jpg', 2399, 2899, 4.6, 142, NULL, ARRAY['oferta']::text[], '4K completo no tamanho ideal para a sua sala.', 'TV 4K de 50" com HDR, Wi-Fi e Bluetooth. Acesso aos principais apps de streaming.', '[["Tela","50\" LED 4K"],["HDR","HDR10"],["Conexões","3x HDMI, 2x USB"]]'::jsonb, 20, 3, 9),
('console-kairo-one-1tb', 'Console Kairo One 1TB SSD 4K 120fps com Controle Sem Fio Preto', 'Kairo', 'GT-6001', 'games', '/__l5e/assets-v1/3be4f7a1-5f75-42d9-a9de-58f8254393ad/console.jpg', 4499, 4999, 4.9, 512, 'Destaque', ARRAY['destaque','mais-vendido','oferta']::text[], 'Nova geração de games em 4K com SSD ultrarrápido.', 'Jogue em 4K a até 120fps com ray tracing, carregamentos instantâneos pelo SSD de 1TB e controle sem fio com resposta tátil.', '[["Armazenamento","SSD 1TB"],["Resolução","Até 4K 120fps"],["Recursos","Ray tracing, HDR"],["Inclui","1 controle sem fio"]]'::jsonb, 9, 3, 10),
('controle-kairo-pro-wireless', 'Controle Sem Fio Kairo Pro Wireless Bluetooth para PC e Console Preto', 'Kairo', 'GT-6002', 'games', '/__l5e/assets-v1/9d07b931-7b30-4c1b-b8d9-3a4eb94ce602/controle-gamer.jpg', 449, 549, 4.7, 330, NULL, ARRAY['oferta','mais-vendido']::text[], 'Precisão e conforto para longas sessões.', 'Controle sem fio com gatilhos de precisão, vibração dupla e bateria recarregável de até 30 horas.', '[["Conexão","Bluetooth e USB-C"],["Bateria","Até 30h"],["Compatível","PC, console e mobile"]]'::jsonb, 14, 3, 11),
('monitor-vertex-34-curvo', 'Monitor Gamer Vertex 34" Curvo Ultrawide WQHD 165Hz 1ms', 'Vertex', 'GT-7001', 'perifericos', '/__l5e/assets-v1/0d5c7a39-8196-4b1b-b1a0-1395b3adf9ce/monitor-gamer.jpg', 2799, 3399, 4.8, 121, '-18%', ARRAY['oferta','destaque','lancamento']::text[], 'Imersão total com 165Hz e tela ultrawide.', 'Monitor curvo 1500R ultrawide WQHD com 165Hz, 1ms e HDR. Ideal para games competitivos e produtividade em multitarefa.', '[["Tela","34\" curva 1500R"],["Resolução","3440 x 1440"],["Taxa","165Hz, 1ms"],["Conexões","2x HDMI, DisplayPort"]]'::jsonb, 22, 3, 12),
('teclado-mecanico-vertex-k65', 'Teclado Mecânico Gamer Vertex K65 Compacto Switch Red Iluminação Âmbar', 'Vertex', 'GT-7002', 'perifericos', '/__l5e/assets-v1/3b9a07c0-cdcc-4f13-9122-1ad2ea78ee7c/teclado-mecanico.jpg', 399, 499, 4.7, 288, NULL, ARRAY['oferta','mais-vendido']::text[], 'Resposta rápida em formato compacto 65%.', 'Teclado mecânico 65% com switches lineares red, keycaps PBT e iluminação âmbar por tecla.', '[["Formato","65% compacto"],["Switch","Linear Red"],["Conexão","USB-C e Bluetooth"]]'::jsonb, 40, 3, 13),
('mouse-gamer-vertex-m9', 'Mouse Gamer Sem Fio Vertex M9 26.000 DPI 8 Botões RGB Preto', 'Vertex', 'GT-7003', 'perifericos', '/__l5e/assets-v1/9f060fbd-be45-425c-ba5b-6aab2a97e22e/mouse-gamer.jpg', 279, 349, 4.8, 401, NULL, ARRAY['oferta','mais-vendido']::text[], 'Sensor de alta precisão e ergonomia premium.', 'Mouse sem fio com sensor de 26.000 DPI, 8 botões programáveis e bateria de até 70 horas.', '[["Sensor","26.000 DPI"],["Botões","8 programáveis"],["Bateria","Até 70h"]]'::jsonb, 7, 3, 14),
('tablet-nexa-tab-11', 'Tablet Nexa Tab 11" 256GB Wi-Fi com Caneta Stylus Cinza Espacial', 'Nexa', 'GT-8001', 'tablets', '/__l5e/assets-v1/e19d5dac-9cad-4fd9-a0aa-7e7a84fdfc63/tablet.jpg', 2999, 3599, 4.7, 167, 'Lançamento', ARRAY['lancamento','destaque','oferta']::text[], 'Tela de 11" e caneta inclusa para criar sem limites.', 'Tablet com tela de 11" 120Hz, 256GB e caneta stylus inclusa. Perfeito para estudos, desenho e entretenimento.', '[["Tela","11\" 120Hz"],["Armazenamento","256GB"],["Inclui","Caneta stylus"],["Bateria","Até 12h"]]'::jsonb, 11, 3, 15),
('drone-orbit-air-4k', 'Drone Orbit Air 4K com Gimbal 3 Eixos 34min de Voo Dobrável', 'Orbit', 'GT-9001', 'drones', '/__l5e/assets-v1/97987509-8e30-4a44-bb91-de16705a171a/drone.jpg', 3899, 4599, 4.8, 74, NULL, ARRAY['destaque','oferta','lancamento']::text[], 'Imagens aéreas em 4K estabilizadas.', 'Drone dobrável com câmera 4K, gimbal de 3 eixos, até 34 minutos de voo e detecção de obstáculos.', '[["Câmera","4K 60fps"],["Estabilização","Gimbal 3 eixos"],["Autonomia","Até 34 min"],["Alcance","Até 10 km"]]'::jsonb, 5, 3, 16);