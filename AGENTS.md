<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Storefront is front-end only: catalog lives in `src/data/catalog.ts`, cart in `src/lib/cart.tsx` (localStorage). No backend until the owner asks for one.
- Orders are sent by WhatsApp link built in `src/lib/whatsapp.ts`; keep message/number logic there so `src/test/whatsapp-order.test.ts` covers it.
- Price formatting/display rules live in `src/lib/pricing.ts`; components must not compute payment terms themselves.
- Admin period filters use `src/lib/date-range.ts` (local timezone, inclusive start, exclusive next-day end) and sales metrics use `src/lib/orders.ts` helpers, both covered by `src/test/admin-metrics.test.ts`, so dashboard and orders pages stay consistent.
