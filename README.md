# ระบบร้านค้าออนไลน์เล็ก (Shopping mini System)

Next.js + Supabase + Vercel — ระบบขายสินค้าออนไลน์ขนาดเล็ก รองรับ:
- แอดมินนำเข้าสินค้าเป็นชุดจากไฟล์ Excel
- ตั้งราคาและส่วนลดตามจำนวนซื้อ (หลายเงื่อนไข)
- ลูกค้าดูรายละเอียดสินค้า เลือกสินค้า ใส่ตะกร้า
- ดูสรุปคำสั่งซื้อ (จำนวน, รายการ, ส่วนลด, ยอดสุทธิ) ก่อนยืนยัน
- ยืนยันคำสั่งซื้อ → บันทึกลงฐานข้อมูล (ไม่มีระบบชำระเงินในตัว)
- แสดงลิงก์ Line OA พร้อมเลขที่คำสั่งซื้อ (ปุ่มคัดลอก) หลังยืนยัน
- แอดมินจัดการสถานะคำสั่งซื้อ: รอชำระเงิน → ชำระเงินแล้ว → กำลังจัดส่ง → เสร็จสิ้น (และยกเลิก)

---

## 1. โครงสร้างโปรเจกต์

```
src/
  app/
    page.tsx                  หน้าแรก - รายการสินค้า
    products/[id]/page.tsx    หน้ารายละเอียดสินค้า
    cart/page.tsx              ตะกร้า + กรอกข้อมูลสั่งซื้อ
    order/[orderNo]/page.tsx   หน้ายืนยันคำสั่งซื้อ + ลิงก์ Line OA
    admin/                     หน้าแอดมินทั้งหมด (login, products, orders, settings)
    api/                       API routes (สร้างคำสั่งซื้อ, อัปโหลด Excel, เปลี่ยนสถานะ)
  components/                  React components
  lib/                         Supabase clients, discount logic, cart state, types
supabase/
  schema.sql                   SQL schema ทั้งหมด (รันครั้งเดียวตอนตั้งค่า Supabase)
```

---

## 2. ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** → รันไฟล์ `supabase/schema.sql` ทั้งหมด
   - จะได้ตาราง: `products`, `promotion_tiers`, `orders`, `order_items`, `settings`, `admins`
   - สร้าง Storage bucket ชื่อ `product-images` (public) พร้อม policy อัตโนมัติ
3. ไปที่ **Authentication → Users** → กด "Add user" เพื่อสร้างบัญชีแอดมิน (อีเมล + รหัสผ่าน)
4. ไปที่ **SQL Editor** อีกครั้ง รันคำสั่งนี้เพื่อให้บัญชีนั้นเป็นแอดมิน (แก้อีเมลให้ตรง):
   ```sql
   insert into admins (email) values ('your-admin-email@example.com');
   ```
5. ไปที่ **Project Settings → API** คัดลอกค่า 3 ค่านี้ไว้ใช้ในขั้นตอนถัดไป:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ เก็บเป็นความลับ ห้ามใส่ในโค้ดฝั่ง client)

---

## 3. ตั้งค่าตัวแปรแวดล้อม (Environment Variables)

คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่าจาก Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxx
```

---

## 4. รันบนเครื่อง (Local Development)

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 สำหรับหน้าร้าน และ http://localhost:3000/admin/login สำหรับหน้าแอดมิน

---

## 5. Deploy ขึ้น GitHub + Vercel

1. Push โค้ดทั้งหมดขึ้น GitHub repository ใหม่
2. ไปที่ [vercel.com](https://vercel.com) → **Add New Project** → เลือก repo นี้
3. ในหน้า **Environment Variables** ของ Vercel ใส่ตัวแปร 3 ตัวเดียวกับ `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. กด **Deploy**

หลัง deploy เสร็จ ระบบจะพร้อมใช้งานทันทีที่ URL ที่ Vercel ให้มา

---

## 6. การใช้งานสำหรับแอดมิน

1. เข้า `/admin/login` ล็อกอินด้วยอีเมล/รหัสผ่านที่สร้างไว้ใน Supabase
2. **สินค้า** → กด "ดาวน์โหลดแบบฟอร์ม" เพื่อได้ไฟล์ Excel ตัวอย่าง กรอกข้อมูลแล้วอัปโหลดกลับเข้าระบบ
   - คอลัมน์ในไฟล์: `sku, name, description, image_url, unit_price, active`
   - ระบบใช้ `sku` เป็นตัวอ้างอิง ถ้า sku ซ้ำจะอัปเดตข้อมูลเดิม ถ้าไม่ซ้ำจะเพิ่มสินค้าใหม่
3. กด "แก้ไข" ที่สินค้าแต่ละชิ้นเพื่อ **อัปโหลดรูปภาพ** และ **ตั้งส่วนลดตามจำนวนซื้อ** (ใส่ได้หลายเงื่อนไข เช่น ซื้อ 5-9 ชิ้น ลด 5%, ซื้อ 10 ชิ้นขึ้นไป ลด 10%)
4. **ตั้งค่า** → ใส่ลิงก์ Line OA (ต้องขึ้นต้นด้วย https://) ระบบจะแสดงลิงก์นี้ให้ลูกค้าหลังยืนยันคำสั่งซื้อ
5. **โปรโมชัน** → ตั้งส่วนลดตามยอดสั่งซื้อรวม (เช่น ซื้อครบ 100 บาท ลด 10 บาท, ซื้อครบ 500 บาท ลด 100 บาท) คำนวณจากยอดหลังหักส่วนลดสินค้าแล้ว ใช้เงื่อนไขที่ให้ส่วนลดสูงสุดเพียงเงื่อนไขเดียว (ไม่รวมกัน)
6. **คำสั่งซื้อ** → ดูรายการคำสั่งซื้อทั้งหมด กรองตามสถานะ และเปลี่ยนสถานะได้จากช่อง dropdown ในแต่ละแถว

---

## 7. หมายเหตุด้านความปลอดภัย

- ราคาสินค้าและส่วนลดคำนวณที่ฝั่งเซิร์ฟเวอร์เสมอ (`/api/orders`) ไม่เชื่อค่าที่ส่งมาจากเบราว์เซอร์โดยตรง ป้องกันการปลอมราคา
- หน้า `/admin/*` ถูกป้องกันด้วย proxy/middleware (ตรวจสอบ login) และ Row Level Security ของ Supabase (ตรวจสอบว่าอีเมลอยู่ในตาราง `admins`)
- `SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะฝั่งเซิร์ฟเวอร์ (API routes) เท่านั้น ห้าม expose ให้ฝั่ง client

---

## 8. ขอบเขตที่ยังไม่รวมในระบบนี้

- ระบบชำระเงินออนไลน์ (ตามที่ระบุไว้ — ชำระผ่าน Line OA แยกต่างหาก)
- ระบบบัญชีลูกค้า/ประวัติการสั่งซื้อของลูกค้า (ปัจจุบันสั่งซื้อแบบ guest)
- การแจ้งเตือนอัตโนมัติ (เช่น อีเมล/SMS เมื่อสถานะเปลี่ยน) — สามารถเพิ่มได้ภายหลัง
