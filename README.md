# 🌿 บ้านหวาย Tourism — ระบบแนะนำสถานที่ท่องเที่ยวตำบลบ้านหวาย

เว็บแอปพลิเคชันแนะนำสถานที่ท่องเที่ยวตำบลบ้านหวาย พัฒนาด้วย Next.js 15, Tailwind CSS v4 และ Prisma ORM

---

## 🛠 Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | JavaScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma |
| Database | MySQL |
| Auth | Jose (JWT) + HttpOnly Cookie |
| AI | Gemini API (Google) |
| QR Code | qrcodejs (CDN) |

---

## 📦 ติดตั้งและรัน

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า .env
```bash
cp .env.example .env
```
แก้ไข `.env`:
```
DATABASE_URL="mysql://username:password@localhost:3306/banwai_tourism"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
GEMINI_API_KEY="your-gemini-api-key"  # ขอฟรีที่ https://aistudio.google.com
```

### 3. Setup Database
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### 4. รัน
```bash
npm run dev
```
→ เปิด http://localhost:3000

---

## 🗺 หน้าสำหรับผู้ใช้ทั่วไป

| หน้า | URL | คำอธิบาย |
|------|-----|---------|
| หน้าแรก | `/` | Hero + Feature cards + สถานที่ + ข่าวสาร |
| สถานที่ทั้งหมด | `/places` | Grid + Filter หมวดหมู่ + ค้นหา |
| รายละเอียดสถานที่ | `/places/[id]` | ข้อมูล + รีวิว + QR Code + แชร์ |
| แผนที่ | `/map` | SVG Map + Pin + Detail panel |
| จัดทริป AI | `/trip` | Gemini AI วางแผนทริปอัตโนมัติ |
| สถานที่ถูกใจ | `/favorites` | Session-based bookmark |
| ข่าวสาร | `/announcements` | ประกาศจากชุมชน |

---

## 🔐 ระบบหลังบ้าน (Admin)

**เข้าสู่ระบบ:** `/login`

| บัญชีเริ่มต้น | ค่า |
|-------------|-----|
| Email | admin@banwai.go.th |
| Password | admin1234 |

### หน้า Admin

| หน้า | URL | สิทธิ์ |
|------|-----|--------|
| Dashboard | `/admin` | Admin + Staff |
| สถานที่ | `/admin/places` | Admin + Staff |
| รีวิว | `/admin/reviews` | Admin + Staff |
| ประกาศ | `/admin/announcements` | Admin + Staff |
| สถิติ+กราฟ | `/admin/stats` | Admin + Staff |
| จัดการผู้ใช้ | `/admin/users` | Admin เท่านั้น |
| ข้อมูลส่วนตัว | `/admin/profile` | ทุกคน |

---

## 🗄 Database (10 ตาราง)

```
USERS ──────┬── STAFF_PERMISSIONS ── PLACES ──┬── CATEGORIES
            ├── REVIEW_REPLIES ─── REVIEWS    ├── PLACE_IMAGES
            └── ANNOUNCEMENTS                  ├── FAVORITES
                                               └── VIEW_STATS
```

---

## 🤖 AI Trip Planner

ใช้ Gemini 1.5 Flash API ดึงข้อมูลสถานที่จาก DB แล้วส่ง prompt ให้ AI วางแผนทริป

**ถ้าไม่มี `GEMINI_API_KEY`:** ระบบจะแสดงตัวอย่างแผนทริปแบบ mock แทน

**ขอ API Key ฟรี:** https://aistudio.google.com/app/apikey

---

## 📱 QR Code & Share

หน้ารายละเอียดสถานที่มีปุ่ม:
- 🔗 คัดลอกลิงก์
- 📱 QR Code (สแกนได้ด้วยสมาร์ตโฟน)
- Facebook / LINE / X (Twitter)

---

## 📊 Scripts

```bash
npm run dev          # Development
npm run build        # Production build
npm run db:push      # Push schema
npm run db:generate  # Generate Prisma client
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # ข้อมูลตัวอย่าง
```

---

## 🌐 API Endpoints

### Public
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/api/places` | รายการสถานที่ |
| GET | `/api/places/[id]` | รายละเอียด + นับ view |
| GET | `/api/categories` | หมวดหมู่ |
| GET/POST | `/api/reviews` | รีวิว |
| POST | `/api/reviews/reply` | ตอบกลับรีวิว |
| GET/POST | `/api/favorites` | Toggle bookmark |
| GET | `/api/announcements` | ประกาศ |
| POST | `/api/trip` | AI วางแผนทริป |

### Auth
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/api/auth/login` | Login → Set cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | ข้อมูล user ปัจจุบัน |

### Admin (ต้อง Login)
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/api/admin/stats` | สถิติและกราฟ |
| GET/POST | `/api/admin/users` | จัดการ users |
| PUT/DELETE | `/api/admin/users/[id]` | แก้ไข/ลบ user |
| PUT | `/api/admin/users/[id]/permissions` | กำหนดสิทธิ์ |
