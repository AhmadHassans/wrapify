# Wrapify ✨

Gen-Z Eid hamper gifting site + admin panel.

## Stack
- React + Vite (client, port **5173**)
- Express + better-sqlite3 (server, port **5050**)
- Tailwind CSS (soft pink/lilac theme)
- Multer 2.x (image uploads, jpeg/png/webp, 5MB/file)

## Setup

```bash
npm run install:all
npm run dev
```

Open http://localhost:5173

## Ports
- Server: **5050** (port 5000 blocked by macOS AirPlay Receiver)
- Client: **5173**, proxies `/api/*` → server

## Admin
- URL: http://localhost:5173/admin/login
- Password: `wrapify2024` (override via `ADMIN_PASSWORD` env var)
- Hidden from nav. Direct URL only.

## WhatsApp number
Set in [client/.env](client/.env): `VITE_WHATSAPP_NUMBER=923XXXXXXXXX`

## Database
- SQLite file: `server/wrapify.db` (auto-created)
- Auto-seeds 11 products on first run (only if products table empty)
- Reset: delete `server/wrapify.db*`, re-run

## API
| Method | Path | Notes |
|---|---|---|
| GET | `/api/products` | active only (`?all=1` for admin) |
| POST | `/api/products` | multipart, fields + `images[]` + `variant_image_N` |
| PUT | `/api/products/:id` | same as POST |
| DELETE | `/api/products/:id` | |
| POST | `/api/orders` | server recomputes total from DB; rejects mismatch >Rs.1 |
| GET | `/api/orders` | |
| PUT | `/api/orders/:id/status` | `pending\|confirmed\|delivered\|cancelled` |
| POST | `/api/admin/login` | `{password}` → `{success}` |

## Data conventions
- `products.images` stores filenames only (e.g. `1716_abc.svg`). Frontend prepends `/api/uploads/`.
- `variants[].price_add` added on top of base price.
- Seed images are SVG placeholders. Real uploads go to `server/uploads/`.

## Security
- Admin password read from `process.env.ADMIN_PASSWORD` (fallback `wrapify2024`)
- CORS strict to `http://localhost:5173`
- Multer: 5MB/file limit, jpeg/png/webp only, random filenames
- Order total recomputed server-side from current product prices

## Build for prod
```bash
npm --prefix client run build
# Serve client/dist with any static host; keep server running on 5050
```
