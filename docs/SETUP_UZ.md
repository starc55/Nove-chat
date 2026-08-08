# NOVA: boshidan productiongacha qo‘llanma

## 1. Arxitektura

```text
React browser
  ├─ HTTP ───────────────> Express API
  └─ Socket.IO ──────────> Express API
                              ├─ Prisma runtime ──> Neon pooled URL
                              └─ migrations ──────> Neon direct URL

Telegram operator bot
  └─ HTTPS webhook ──────> Express API ──> Neon + Socket.IO ──> mijoz chat widgeti
```

Frontend Neon bazasiga yoki “Neon WebSocket”ga ulanmaydi. Saytdagi realtime aloqa browser va Express orasidagi Socket.IO orqali ishlaydi.

## 2. Lokal ishga tushirish

```powershell
cd C:\Users\New\Desktop\Chat
npm install
npm run db:generate
npm run db:seed
npm run dev
```

Manzillar:

```text
Landing: http://localhost:5173
Admin:   http://localhost:5173/admin/login
API:     http://localhost:4000/api/v1
Health:  http://localhost:4000/api/v1/health
Socket:  http://localhost:4000/socket.io
```

Development admin:

```text
Email: admin@nova.uz
Parol: NovaDev2026!
```

## 3. Admin paneldan foydalanish

1. `http://localhost:5173/admin/login` manziliga kiring.
2. `Mahsulotlar` bo‘limida sarlavha, slug, narx, kategoriya, rasm URL va holatni kiriting.
3. `Reklamalar` bo‘limida CTA, joylashuv, boshlanish/tugash vaqti va faollikni belgilang.
4. `Operatorlar` bo‘limida operator emaili, vaqtinchalik parol va Telegram User ID’ni kiriting.

Operator o‘chirilganda chat tarixi o‘chmaydi: hisob faolsizlanadi va Telegram ruxsati bekor qilinadi.

## 4. Neon environment

`apps/api/.env`:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL="Neon pooled connection string (-pooler host)"
DIRECT_URL="Neon direct connection string"
JWT_ACCESS_SECRET="kamida 32 belgili tasodifiy secret"
JWT_REFRESH_SECRET="boshqa kamida 32 belgili secret"
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=7
```

Schema yangilanganda:

```powershell
npm run db:generate
cd apps/api
npx prisma migrate deploy
```

Productionda `prisma migrate deploy`, lokal schema ishlab chiqishda esa nomlangan `prisma migrate dev` ishlatiladi.

## 5. Telegram bot yaratish

1. Telegram’da rasmiy `@BotFather`ni oching.
2. `/newbot` yuboring, nom va username tanlang.
3. Berilgan tokenni xavfsiz saqlang. Tokenni chatga, frontendga yoki Git’ga yozmang.
4. Bot profilida operatorlar uchun qisqa tavsif va buyruqlarni kiriting. Server webhook o‘rnatilganda buyruqlar ro‘yxatini ham avtomatik sozlaydi.

Production API environmentiga qo‘shing:

```env
TELEGRAM_BOT_TOKEN=123456789:botfather-bergan-token
TELEGRAM_WEBHOOK_SECRET=kamida-16-belgili-tasodifiy-secret
TELEGRAM_WEBHOOK_URL=https://api.example.com/api/v1/telegram/webhook
TELEGRAM_RETRY_LIMIT=5
```

PowerShell’da xavfsiz webhook secret yaratish:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
```

API’ni qayta ishga tushiring. Admin paneldagi `Operatorlar` sahifasiga kirib `Webhookni ulash` tugmasini bosing.

Telegram webhook uchun talablar:

- public HTTPS URL;
- Express ishlaydigan doimiy Node process;
- `POST /api/v1/telegram/webhook` tashqaridan ochiq;
- webhook secret server muhitida mavjud;
- bot token faqat backendda mavjud.

## 6. Operatorni botga ulash

Eng qulay oqim:

1. Operator yangi botni ochib `/start` yuboradi.
2. Hali ruxsat berilmagan bo‘lsa, bot operatorning Telegram ID’sini ko‘rsatadi.
3. Admin shu ID’ni `Admin → Operatorlar → operatorni tahrirlash → Telegram User ID` maydoniga kiritadi.
4. Operator `/start`ni yana yuboradi.
5. Bot “muvaffaqiyatli ulandingiz” deb javob beradi; admin panelda holat `Ulangan` bo‘ladi.

Username ruxsat uchun yetarli emas. Asosiy identifikator o‘zgarmaydigan raqamli Telegram User ID hisoblanadi.

## 7. Bot orqali mijozga javob berish

Saytdagi mijoz xabar yuborganda:

1. xabar Neon `Message` jadvalida saqlanadi;
2. Telegram yetkazish navbatiga yoziladi;
3. biriktirilgan operatorga, biriktirilmagan bo‘lsa tasdiqlangan operatorlarga notification boradi;
4. operator `Qabul qilish`ni bosadi;
5. bot oxirgi chat tarixini chiqaradi;
6. operator oddiy matn yuboradi;
7. matn Neon’da saqlanadi va Socket.IO orqali saytdagi mijozga darhol ko‘rinadi.

Bot buyruqlari:

```text
/start            botni operatorga ulash
/waiting          kutilayotgan chatlar
/chats            operatorning faol chatlari
/open C1234ABCD   chatni ochish/qabul qilish
/close            joriy chatni yopish
/cancel           joriy chat tanlovini bekor qilish
/help             yordam
```

Bir operator boshqa operatorga biriktirilgan chatga javob bera olmaydi. Har webhook `update_id` bo‘yicha deduplikatsiya qilinadi. Telegram vaqtincha ishlamasa, notification bazadagi navbat orqali eksponensial kechikish bilan qayta yuboriladi.

## 8. Production deploy

API muhitida:

```env
NODE_ENV=production
CLIENT_URL=https://app.example.com
DATABASE_URL=Neon-pooled-url
DIRECT_URL=Neon-direct-url
JWT_ACCESS_SECRET=production-random-secret
JWT_REFRESH_SECRET=another-production-random-secret
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
TELEGRAM_WEBHOOK_URL=https://api.example.com/api/v1/telegram/webhook
```

Frontend build muhitida:

```env
VITE_API_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
```

Deploy tartibi:

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

`npm run db:seed` productionda bloklangan, chunki development paroli productionga tushmasligi kerak.

## 9. Tekshiruv ro‘yxati

- `GET /api/v1/health` — `status: ok`;
- admin login ishlaydi;
- mahsulot qo‘shilgach landingda ko‘rinadi;
- faollashtirilgan reklama belgilangan joyda ko‘rinadi;
- operator Telegram ID bilan yaratilgan;
- operator botga `/start` yuborib `Ulangan` holatiga o‘tgan;
- saytdan yuborilgan xabar Telegram’ga kelgan;
- bot javobi saytda sahifani yangilamasdan ko‘ringan;
- production reverse proxy `/socket.io` WebSocket upgrade’ni uzatadi;
- frontend va API HTTPS’da ishlaydi.

## 10. Muhim cheklov

Bot tokeni va public HTTPS API URL bo‘lmaguncha Telegram’ning real webhookini lokal kompyuterdan yakuniy ulab bo‘lmaydi. Kod, admin boshqaruvi, webhook endpointi va retry oqimi tayyor; oxirgi qadam production environment qiymatlarini kiritib `Webhookni ulash`ni bosishdir.
