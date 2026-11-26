# Migração do backend para Google Planilhas

## Estado desta etapa

- Branch de trabalho: `migration/google-sheets-backend`
- A vitrine e o painel continuam operando no Supabase.
- Foi criado o adaptador server-side inicial em `src/lib/google-sheets.server.ts`.
- Nenhuma tabela, imagem, usuário ou pedido foi apagado ou alterado.
- Ainda não houve troca do backend em produção.

## Inventário confirmado no Supabase

| Aba planejada | Tabela atual | Registros atuais |
| --- | --- | ---: |
| products | products | 35 |
| orders | orders | 4 |
| order_items | order_items | 5 |
| stock_movements | stock_movements | 33 |
| store_settings | store_settings | 1 |
| store_brands | store_brands | 5 |
| customer_gallery | customer_gallery | 1 |
| store_categories | store_categories | 11 |
| admin_emails | admin_emails | 3 |
| user_roles | user_roles | 3 |

As relações atuais incluem itens vinculados a pedidos e produtos, movimentações de estoque vinculadas a produtos/pedidos e papéis vinculados aos usuários de autenticação.

## Funcionalidades que ainda dependem do Supabase

1. Produtos: listagem, cadastro, edição, exclusão, ativação, categorias e upload de imagens.
2. Pedidos: leitura, itens e atualização de status.
3. Estoque: consulta e registro de movimentações.
4. Categorias e marcas: operações CRUD e ordenação.
5. Configurações da loja: leitura e atualização.
6. Galeria de clientes: CRUD e upload de fotos.
7. Autenticação do painel: login, sessão, recuperação de senha e autorização de administrador.
8. Storage: fotos de produtos, galeria, imagens de categorias e logo.

## Regras para a migração

- Manter IDs existentes para preservar relações.
- Exportar e conferir contagens antes de importar.
- Criar cabeçalhos fixos em cada aba; não depender da posição visual das colunas.
- Preservar campos JSON (especificações, variantes e opções de pedido) como JSON serializado.
- Não migrar senhas ou hashes de autenticação para uma planilha.
- Não remover Supabase nem alterar a origem de leitura em produção até validar todas as funcionalidades no ambiente de Preview.
- Manter backup integral do banco e dos arquivos antes do corte.

## Dependências externas ainda necessárias

- Google Sheets API habilitada e planilha compartilhada com a conta de serviço.
- Para eliminar também o Supabase Storage, será necessário escolher e configurar um armazenamento de arquivos compatível (por exemplo, Google Drive) e migrar os 279 objetos existentes.
- A autenticação administrativa precisa de uma solução própria segura antes de remover Supabase Auth. A planilha não deve armazenar senhas em texto puro.
- A integração inicial usa `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` e `GOOGLE_SHEET_ID`, exclusivamente no servidor.
