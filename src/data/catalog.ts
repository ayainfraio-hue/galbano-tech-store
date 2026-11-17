import smartphone from "@/assets/products/smartphone.jpg";
import notebook from "@/assets/products/notebook.jpg";
import headphone from "@/assets/products/headphone.jpg";
import smartwatch from "@/assets/products/smartwatch.jpg";
import smartTv from "@/assets/products/smart-tv.jpg";
import controle from "@/assets/products/controle-gamer.jpg";
import caixaSom from "@/assets/products/caixa-de-som.jpg";
import tablet from "@/assets/products/tablet.jpg";
import mouse from "@/assets/products/mouse-gamer.jpg";
import teclado from "@/assets/products/teclado-mecanico.jpg";
import monitor from "@/assets/products/monitor-gamer.jpg";
import foneTws from "@/assets/products/fone-tws.jpg";
import drone from "@/assets/products/drone.jpg";
import consoleImg from "@/assets/products/console.jpg";

export type CategorySlug =
  | "smartphones"
  | "notebooks"
  | "audio"
  | "smartwatches"
  | "tv-e-video"
  | "games"
  | "perifericos"
  | "tablets"
  | "drones";

export interface Category {
  slug: CategorySlug;
  name: string;
  image: string;
}

export type ProductTag = "oferta" | "destaque" | "mais-vendido" | "lancamento";

export interface Product {
  slug: string;
  name: string;
  brand: string;
  sku: string;
  category: CategorySlug;
  image: string;
  /** Preço de venda. */
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  tags: ProductTag[];
  short: string;
  description: string;
  specs: [string, string][];
}

export const categories: Category[] = [
  { slug: "smartphones", name: "Smartphones", image: smartphone },
  { slug: "notebooks", name: "Notebooks", image: notebook },
  { slug: "audio", name: "Áudio", image: headphone },
  { slug: "smartwatches", name: "Smartwatches", image: smartwatch },
  { slug: "tv-e-video", name: "TV e Vídeo", image: smartTv },
  { slug: "games", name: "Games", image: consoleImg },
  { slug: "perifericos", name: "Periféricos", image: teclado },
  { slug: "tablets", name: "Tablets", image: tablet },
  { slug: "drones", name: "Drones", image: drone },
];

export const brands = ["Aurum", "Nexa", "Voltix", "Pulse", "Orbit", "Kairo", "Lumen", "Vertex"];

export const products: Product[] = [
  {
    slug: "smartphone-aurum-x-pro-256gb",
    name: "Smartphone Aurum X Pro 256GB 5G Tela 6.7\" Câmera Tripla 50MP Grafite",
    brand: "Aurum",
    sku: "GT-1001",
    category: "smartphones",
    image: smartphone,
    price: 5499,
    oldPrice: 6999,
    rating: 4.9,
    reviews: 312,
    badge: "Black November",
    tags: ["oferta", "destaque", "mais-vendido"],
    short: "Desempenho de ponta, tela AMOLED 120Hz e câmera tripla profissional.",
    description:
      "O Aurum X Pro combina design em titânio grafite, tela AMOLED de 6.7\" com 120Hz e um conjunto de câmeras triplas de 50MP para fotos incríveis de dia e de noite. Bateria para o dia todo com carregamento rápido de 65W.",
    specs: [
      ["Tela", "6.7\" AMOLED 120Hz"],
      ["Armazenamento", "256GB"],
      ["Memória RAM", "12GB"],
      ["Câmera traseira", "50MP + 48MP + 12MP"],
      ["Bateria", "5.000 mAh, carga 65W"],
      ["Conectividade", "5G, Wi-Fi 7, NFC"],
    ],
  },
  {
    slug: "smartphone-aurum-x-128gb",
    name: "Smartphone Aurum X 128GB 5G Tela 6.4\" Câmera Dupla 50MP Grafite",
    brand: "Aurum",
    sku: "GT-1002",
    category: "smartphones",
    image: smartphone,
    price: 3299,
    oldPrice: 3899,
    rating: 4.7,
    reviews: 188,
    tags: ["oferta", "mais-vendido"],
    short: "O equilíbrio perfeito entre potência e preço.",
    description:
      "Versão compacta da linha Aurum X, com 5G, tela de 6.4\" e câmera dupla de 50MP. Ideal para quem quer performance premium com excelente custo-benefício.",
    specs: [
      ["Tela", "6.4\" AMOLED 90Hz"],
      ["Armazenamento", "128GB"],
      ["Memória RAM", "8GB"],
      ["Câmera traseira", "50MP + 12MP"],
      ["Bateria", "4.500 mAh"],
      ["Conectividade", "5G, Wi-Fi 6"],
    ],
  },
  {
    slug: "notebook-nexa-book-14-i7-16gb",
    name: "Notebook Nexa Book 14\" Intel Core i7 16GB SSD 512GB Tela Full HD Prata",
    brand: "Nexa",
    sku: "GT-2001",
    category: "notebooks",
    image: notebook,
    price: 5899,
    oldPrice: 6799,
    rating: 4.8,
    reviews: 154,
    badge: "Mais vendido",
    tags: ["oferta", "destaque", "mais-vendido"],
    short: "Leve, rápido e com bateria para o dia todo.",
    description:
      "O Nexa Book 14 é ultrafino, com corpo em alumínio, processador Intel Core i7 e SSD de 512GB. Perfeito para trabalho, estudos e produtividade em qualquer lugar.",
    specs: [
      ["Processador", "Intel Core i7 13ª geração"],
      ["Memória RAM", "16GB DDR5"],
      ["Armazenamento", "SSD 512GB NVMe"],
      ["Tela", "14\" Full HD IPS"],
      ["Peso", "1,3 kg"],
      ["Sistema", "Windows 11"],
    ],
  },
  {
    slug: "notebook-nexa-book-15-i5-8gb",
    name: "Notebook Nexa Book 15\" Intel Core i5 8GB SSD 256GB Tela Full HD Prata",
    brand: "Nexa",
    sku: "GT-2002",
    category: "notebooks",
    image: notebook,
    price: 3699,
    oldPrice: 4199,
    rating: 4.6,
    reviews: 97,
    tags: ["oferta"],
    short: "Produtividade essencial com tela ampla.",
    description:
      "Notebook de 15\" com processador Intel Core i5, ideal para tarefas do dia a dia, estudos e home office.",
    specs: [
      ["Processador", "Intel Core i5 12ª geração"],
      ["Memória RAM", "8GB"],
      ["Armazenamento", "SSD 256GB"],
      ["Tela", "15.6\" Full HD"],
      ["Sistema", "Windows 11"],
    ],
  },
  {
    slug: "headphone-pulse-anc-900",
    name: "Headphone Bluetooth Pulse ANC 900 com Cancelamento de Ruído Preto",
    brand: "Pulse",
    sku: "GT-3001",
    category: "audio",
    image: headphone,
    price: 1299,
    oldPrice: 1699,
    rating: 4.8,
    reviews: 421,
    badge: "-24%",
    tags: ["oferta", "destaque", "mais-vendido"],
    short: "Silêncio absoluto e som de estúdio por até 40 horas.",
    description:
      "Cancelamento ativo de ruído adaptativo, drivers de 40mm e até 40 horas de bateria. Conforto premium com almofadas em couro sintético.",
    specs: [
      ["Conexão", "Bluetooth 5.3"],
      ["Bateria", "Até 40h"],
      ["Cancelamento de ruído", "Ativo adaptativo"],
      ["Drivers", "40mm"],
      ["Peso", "250g"],
    ],
  },
  {
    slug: "fone-pulse-buds-pro",
    name: "Fone de Ouvido Sem Fio Pulse Buds Pro TWS com Estojo de Carga Branco",
    brand: "Pulse",
    sku: "GT-3002",
    category: "audio",
    image: foneTws,
    price: 599,
    oldPrice: 799,
    rating: 4.7,
    reviews: 603,
    tags: ["oferta", "mais-vendido", "lancamento"],
    short: "Compacto, com cancelamento de ruído e áudio espacial.",
    description:
      "Fones true wireless com cancelamento de ruído, modo ambiente e até 30 horas com o estojo. Resistentes a respingos (IPX4).",
    specs: [
      ["Conexão", "Bluetooth 5.3"],
      ["Bateria", "6h + 24h no estojo"],
      ["Resistência", "IPX4"],
      ["Recursos", "ANC e modo ambiente"],
    ],
  },
  {
    slug: "caixa-de-som-voltix-boom-360",
    name: "Caixa de Som Bluetooth Voltix Boom 360 à Prova d'Água 40W Preta",
    brand: "Voltix",
    sku: "GT-3003",
    category: "audio",
    image: caixaSom,
    price: 899,
    oldPrice: 1099,
    rating: 4.6,
    reviews: 276,
    tags: ["oferta", "destaque", "lancamento"],
    short: "Som 360° potente para levar a qualquer lugar.",
    description:
      "Caixa de som portátil com 40W de potência, som 360° e graves profundos. À prova d'água (IP67) e bateria para até 20 horas.",
    specs: [
      ["Potência", "40W RMS"],
      ["Bateria", "Até 20h"],
      ["Resistência", "IP67"],
      ["Conexão", "Bluetooth 5.3"],
    ],
  },
  {
    slug: "smartwatch-orbit-watch-s",
    name: "Smartwatch Orbit Watch S 45mm GPS Monitor Cardíaco Pulseira Preta",
    brand: "Orbit",
    sku: "GT-4001",
    category: "smartwatches",
    image: smartwatch,
    price: 1599,
    oldPrice: 1999,
    rating: 4.7,
    reviews: 233,
    badge: "Lançamento",
    tags: ["lancamento", "destaque", "oferta"],
    short: "Saúde, treino e notificações direto no pulso.",
    description:
      "Tela AMOLED always-on, GPS integrado, monitor de frequência cardíaca, oxigenação e sono. Mais de 100 modos esportivos.",
    specs: [
      ["Tela", "1.9\" AMOLED"],
      ["Caixa", "45mm alumínio"],
      ["Bateria", "Até 7 dias"],
      ["Resistência", "5 ATM"],
      ["Sensores", "GPS, cardíaco, SpO2"],
    ],
  },
  {
    slug: "smart-tv-lumen-65-4k",
    name: "Smart TV Lumen 65\" 4K UHD QLED HDR10+ Wi-Fi Comando de Voz",
    brand: "Lumen",
    sku: "GT-5001",
    category: "tv-e-video",
    image: smartTv,
    price: 4299,
    oldPrice: 5499,
    rating: 4.8,
    reviews: 189,
    badge: "Black November",
    tags: ["oferta", "destaque", "mais-vendido"],
    short: "Cores vivas em 4K com tecnologia QLED.",
    description:
      "Imagem 4K com pontos quânticos, HDR10+ e taxa de 120Hz. Sistema smart com os principais apps de streaming e comando de voz.",
    specs: [
      ["Tela", "65\" QLED 4K"],
      ["Taxa de atualização", "120Hz"],
      ["HDR", "HDR10+, HLG"],
      ["Conexões", "4x HDMI 2.1, 2x USB"],
      ["Smart", "Wi-Fi, Bluetooth, voz"],
    ],
  },
  {
    slug: "smart-tv-lumen-50-4k",
    name: "Smart TV Lumen 50\" 4K UHD LED HDR Wi-Fi Bluetooth",
    brand: "Lumen",
    sku: "GT-5002",
    category: "tv-e-video",
    image: smartTv,
    price: 2399,
    oldPrice: 2899,
    rating: 4.6,
    reviews: 142,
    tags: ["oferta"],
    short: "4K completo no tamanho ideal para a sua sala.",
    description: "TV 4K de 50\" com HDR, Wi-Fi e Bluetooth. Acesso aos principais apps de streaming.",
    specs: [
      ["Tela", "50\" LED 4K"],
      ["HDR", "HDR10"],
      ["Conexões", "3x HDMI, 2x USB"],
    ],
  },
  {
    slug: "console-kairo-one-1tb",
    name: "Console Kairo One 1TB SSD 4K 120fps com Controle Sem Fio Preto",
    brand: "Kairo",
    sku: "GT-6001",
    category: "games",
    image: consoleImg,
    price: 4499,
    oldPrice: 4999,
    rating: 4.9,
    reviews: 512,
    badge: "Destaque",
    tags: ["destaque", "mais-vendido", "oferta"],
    short: "Nova geração de games em 4K com SSD ultrarrápido.",
    description:
      "Jogue em 4K a até 120fps com ray tracing, carregamentos instantâneos pelo SSD de 1TB e controle sem fio com resposta tátil.",
    specs: [
      ["Armazenamento", "SSD 1TB"],
      ["Resolução", "Até 4K 120fps"],
      ["Recursos", "Ray tracing, HDR"],
      ["Inclui", "1 controle sem fio"],
    ],
  },
  {
    slug: "controle-kairo-pro-wireless",
    name: "Controle Sem Fio Kairo Pro Wireless Bluetooth para PC e Console Preto",
    brand: "Kairo",
    sku: "GT-6002",
    category: "games",
    image: controle,
    price: 449,
    oldPrice: 549,
    rating: 4.7,
    reviews: 330,
    tags: ["oferta", "mais-vendido"],
    short: "Precisão e conforto para longas sessões.",
    description: "Controle sem fio com gatilhos de precisão, vibração dupla e bateria recarregável de até 30 horas.",
    specs: [
      ["Conexão", "Bluetooth e USB-C"],
      ["Bateria", "Até 30h"],
      ["Compatível", "PC, console e mobile"],
    ],
  },
  {
    slug: "monitor-vertex-34-curvo",
    name: "Monitor Gamer Vertex 34\" Curvo Ultrawide WQHD 165Hz 1ms",
    brand: "Vertex",
    sku: "GT-7001",
    category: "perifericos",
    image: monitor,
    price: 2799,
    oldPrice: 3399,
    rating: 4.8,
    reviews: 121,
    badge: "-18%",
    tags: ["oferta", "destaque", "lancamento"],
    short: "Imersão total com 165Hz e tela ultrawide.",
    description:
      "Monitor curvo 1500R ultrawide WQHD com 165Hz, 1ms e HDR. Ideal para games competitivos e produtividade em multitarefa.",
    specs: [
      ["Tela", "34\" curva 1500R"],
      ["Resolução", "3440 x 1440"],
      ["Taxa", "165Hz, 1ms"],
      ["Conexões", "2x HDMI, DisplayPort"],
    ],
  },
  {
    slug: "teclado-mecanico-vertex-k65",
    name: "Teclado Mecânico Gamer Vertex K65 Compacto Switch Red Iluminação Âmbar",
    brand: "Vertex",
    sku: "GT-7002",
    category: "perifericos",
    image: teclado,
    price: 399,
    oldPrice: 499,
    rating: 4.7,
    reviews: 288,
    tags: ["oferta", "mais-vendido"],
    short: "Resposta rápida em formato compacto 65%.",
    description: "Teclado mecânico 65% com switches lineares red, keycaps PBT e iluminação âmbar por tecla.",
    specs: [
      ["Formato", "65% compacto"],
      ["Switch", "Linear Red"],
      ["Conexão", "USB-C e Bluetooth"],
    ],
  },
  {
    slug: "mouse-gamer-vertex-m9",
    name: "Mouse Gamer Sem Fio Vertex M9 26.000 DPI 8 Botões RGB Preto",
    brand: "Vertex",
    sku: "GT-7003",
    category: "perifericos",
    image: mouse,
    price: 279,
    oldPrice: 349,
    rating: 4.8,
    reviews: 401,
    tags: ["oferta", "mais-vendido"],
    short: "Sensor de alta precisão e ergonomia premium.",
    description: "Mouse sem fio com sensor de 26.000 DPI, 8 botões programáveis e bateria de até 70 horas.",
    specs: [
      ["Sensor", "26.000 DPI"],
      ["Botões", "8 programáveis"],
      ["Bateria", "Até 70h"],
    ],
  },
  {
    slug: "tablet-nexa-tab-11",
    name: "Tablet Nexa Tab 11\" 256GB Wi-Fi com Caneta Stylus Cinza Espacial",
    brand: "Nexa",
    sku: "GT-8001",
    category: "tablets",
    image: tablet,
    price: 2999,
    oldPrice: 3599,
    rating: 4.7,
    reviews: 167,
    badge: "Lançamento",
    tags: ["lancamento", "destaque", "oferta"],
    short: "Tela de 11\" e caneta inclusa para criar sem limites.",
    description: "Tablet com tela de 11\" 120Hz, 256GB e caneta stylus inclusa. Perfeito para estudos, desenho e entretenimento.",
    specs: [
      ["Tela", "11\" 120Hz"],
      ["Armazenamento", "256GB"],
      ["Inclui", "Caneta stylus"],
      ["Bateria", "Até 12h"],
    ],
  },
  {
    slug: "drone-orbit-air-4k",
    name: "Drone Orbit Air 4K com Gimbal 3 Eixos 34min de Voo Dobrável",
    brand: "Orbit",
    sku: "GT-9001",
    category: "drones",
    image: drone,
    price: 3899,
    oldPrice: 4599,
    rating: 4.8,
    reviews: 74,
    tags: ["destaque", "oferta", "lancamento"],
    short: "Imagens aéreas em 4K estabilizadas.",
    description: "Drone dobrável com câmera 4K, gimbal de 3 eixos, até 34 minutos de voo e detecção de obstáculos.",
    specs: [
      ["Câmera", "4K 60fps"],
      ["Estabilização", "Gimbal 3 eixos"],
      ["Autonomia", "Até 34 min"],
      ["Alcance", "Até 10 km"],
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function productsByTag(tag: ProductTag) {
  return products.filter((p) => p.tags.includes(tag));
}

export function productsByCategory(slug: CategorySlug) {
  return products.filter((p) => p.category === slug);
}

export function searchProducts(query: string) {
  const q = normalize(query);
  if (!q) return products;
  return products.filter((p) =>
    normalize(`${p.name} ${p.brand} ${getCategory(p.category)?.name ?? ""}`).includes(q),
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
