# NOVA Premium Platform

React/Vite landing, Express API, Neon Postgres, Socket.IO live chat, admin boshqaruvi va Telegram operator botidan iborat JavaScript monorepo.

To‘liq ishga tushirish va Telegram ulash qo‘llanmasi: [`docs/SETUP_UZ.md`](docs/SETUP_UZ.md).

## Tayyor funksiyalar

- Neon + Prisma migration va pooled/direct ulanishlar;
- database-driven landing, mahsulotlar va reklamalar;
- JWT access token + rotatsiyalanuvchi HTTP-only refresh cookie;
- admin dashboard;
- mahsulot, reklama va operator CRUD boshqaruvi;
- PostgreSQL’da saqlanadigan bottom-right chat widget;
- Socket.IO realtime xabar va read statuslari;
- Telegram operator avtorizatsiyasi, chatni qabul qilish, javob berish va yopish;
- webhook secret tekshiruvi, update deduplication va xabar yetkazish retry navbati.

## Lokal ishga tushirish

```powershell
cd C:\Users\New\Desktop\Chat
npm install
npm run db:generate
npm run db:seed
npm run dev
```

- Landing: `http://localhost:5173`
- Admin: `http://localhost:5173/admin/login`
- API: `http://localhost:4000/api/v1`
- Health: `http://localhost:4000/api/v1/health`

Development admin: `admin@nova.uz` / `NovaDev2026!`. Bu parol production uchun ishlatilmaydi.

## Admin bo‘limlari

- `/admin/products` — mahsulot qo‘shish, tahrirlash va o‘chirish;
- `/admin/advertisements` — reklama, joylashuv va vaqt oralig‘ini boshqarish;
- `/admin/operators` — operator hisoblari, holati va Telegram ID ruxsatlari;
- `/admin` — KPI, suhbatlar va jamoa dashboardi.

## Production buyruqlari

```powershell
npm ci
npm run db:generate
cd apps/api
npx prisma migrate deploy
cd ../..
npm run build
npm run start -w @nova/api
```

Production admin yaratish:

```powershell
$env:ADMIN_EMAIL='owner@example.com'
$env:ADMIN_PASSWORD='juda-kuchli-maxfiy-parol'
$env:ADMIN_NAME='NOVA Owner'
npm run admin:create -w @nova/api
```

`db:seed` production muhitida ataylab bloklangan.

## Muhim xavfsizlik

- `DATABASE_URL`, `DIRECT_URL`, JWT secretlar va Telegram token faqat API muhitida turadi.
- Frontend Neon yoki Telegram’ga bevosita ulanmaydi.
- Production frontend va API’ni bir parent domen ostida (`app.example.com`, `api.example.com`) ishlatish tavsiya qilinadi.
- Webhook faqat HTTPS orqali va `X-Telegram-Bot-Api-Secret-Token` bilan qabul qilinadi.
- Telegram bot operatorga birinchi bo‘lib yozolmaydi; operator botga `/start` yuborishi shart.
