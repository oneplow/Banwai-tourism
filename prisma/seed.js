const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@banwai.go.th" },
    update: {},
    create: {
      username: "admin",
      email: "admin@banwai.go.th",
      password_hash: hashedPassword,
      role: "admin",
    },
  });

  // Seed categories
  const categories = [
    { name: "วัด / ศาสนสถาน", icon: "🛕", sort_order: 1 },
    { name: "แหล่งธรรมชาติ", icon: "🌿", sort_order: 2 },
    { name: "ตลาด / ของกิน", icon: "🛒", sort_order: 3 },
    { name: "วัฒนธรรม / ประเพณี", icon: "🎎", sort_order: 4 },
    { name: "โฮมสเตย์ / ที่พัก", icon: "🏡", sort_order: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { category_id: cat.sort_order },
      update: {},
      create: cat,
    });
  }

  // Seed places
  const places = [
    {
      category_id: 1,
      name: "วัดบ้านหวาย",
      description:
        "วัดเก่าแก่ประจำตำบลบ้านหวาย มีพระอุโบสถสวยงามสไตล์ล้านนา ภายในประดิษฐานพระพุทธรูปศักดิ์สิทธิ์ที่ชาวบ้านเคารพนับถือมายาวนาน",
      history:
        "วัดบ้านหวายสร้างขึ้นในสมัยรัชกาลที่ 5 โดยชาวบ้านในท้องถิ่นร่วมกันบริจาคทรัพย์สร้างขึ้น เพื่อเป็นศูนย์รวมจิตใจของชุมชน",
      latitude: 16.5210,
      longitude: 102.8340,
      address: "ตำบลบ้านหวาย อำเภอเมือง จังหวัดขอนแก่น",
      phone: "043-000-001",
      open_hours: "06:00-18:00",
      cover_image: "/images/wat-banwai.jpg",
      is_active: true,
    },
    {
      category_id: 2,
      name: "สวนหวายธรรมชาติ",
      description:
        "แหล่งป่าหวายธรรมชาติที่ยังคงความอุดมสมบูรณ์ สามารถเดินชมธรรมชาติ เรียนรู้วิถีการทำหัตถกรรมจักสาน และชมความงามของต้นหวายขนาดใหญ่",
      history:
        "ป่าหวายแห่งนี้เป็นที่มาของชื่อ 'บ้านหวาย' ชาวบ้านใช้หวายในการทำเครื่องใช้มาช้านาน และยังคงรักษาสืบทอดภูมิปัญญานี้ไว้จนถึงปัจจุบัน",
      latitude: 16.5190,
      longitude: 102.8280,
      address: "ตำบลบ้านหวาย อำเภอเมือง จังหวัดขอนแก่น",
      phone: "043-000-002",
      open_hours: "08:00-17:00",
      cover_image: "/images/rattan-forest.jpg",
      is_active: true,
    },
    {
      category_id: 3,
      name: "ตลาดชุมชนบ้านหวาย",
      description:
        "ตลาดชุมชนที่เปิดทุกวันเสาร์-อาทิตย์ มีสินค้าพื้นเมือง อาหารท้องถิ่น และผลิตภัณฑ์จักสานหวายที่มีชื่อเสียง",
      history:
        "ตลาดแห่งนี้เริ่มต้นจากการรวมกลุ่มของแม่บ้านในชุมชน เพื่อนำผลผลิตและสินค้าหัตถกรรมมาจำหน่าย จนพัฒนาเป็นตลาดชุมชนที่มีชื่อเสียง",
      latitude: 16.5230,
      longitude: 102.8360,
      address: "ตำบลบ้านหวาย อำเภอเมือง จังหวัดขอนแก่น",
      phone: "043-000-003",
      open_hours: "06:00-12:00 (เสาร์-อาทิตย์)",
      cover_image: "/images/community-market.jpg",
      is_active: true,
    },
    {
      category_id: 4,
      name: "ศูนย์หัตถกรรมจักสานหวาย",
      description:
        "ศูนย์เรียนรู้และสาธิตการจักสานหวาย ซึ่งเป็นภูมิปัญญาดั้งเดิมของชุมชน นักท่องเที่ยวสามารถเข้าร่วมเวิร์กช็อปและซื้อผลิตภัณฑ์กลับบ้านได้",
      history:
        "ก่อตั้งโดยกลุ่มผู้สูงอายุในหมู่บ้านที่ต้องการถ่ายทอดวิชาจักสานหวายให้คนรุ่นหลัง และพัฒนาเป็นแหล่งท่องเที่ยวเชิงวัฒนธรรม",
      latitude: 16.5200,
      longitude: 102.8320,
      address: "ตำบลบ้านหวาย อำเภอเมือง จังหวัดขอนแก่น",
      phone: "043-000-004",
      open_hours: "09:00-16:00",
      cover_image: "/images/rattan-craft.jpg",
      is_active: true,
    },
    {
      category_id: 5,
      name: "โฮมสเตย์บ้านหวาย",
      description:
        "ที่พักแบบโฮมสเตย์ในบ้านไม้ดั้งเดิม สัมผัสวิถีชีวิตชาวบ้านอย่างแท้จริง พร้อมอาหารเช้าและกิจกรรมท้องถิ่น",
      history:
        "เริ่มเปิดให้บริการในปี พ.ศ. 2560 เพื่อรองรับนักท่องเที่ยวที่ต้องการสัมผัสวิถีชีวิตชุมชน และสร้างรายได้เสริมให้กับครอบครัวในหมู่บ้าน",
      latitude: 16.5215,
      longitude: 102.8350,
      address: "ตำบลบ้านหวาย อำเภอเมือง จังหวัดขอนแก่น",
      phone: "081-000-0001",
      open_hours: "เปิดรับจองตลอด 24 ชม.",
      cover_image: "/images/homestay.jpg",
      is_active: true,
    },
  ];

  for (const place of places) {
    await prisma.place.create({ data: place }).catch(() => {});
  }

  // Seed announcements
  await prisma.announcement.create({
    data: {
      user_id: 1,
      title: "ยินดีต้อนรับสู่ตำบลบ้านหวาย",
      content:
        "ตำบลบ้านหวายขอต้อนรับนักท่องเที่ยวทุกท่าน มาสัมผัสวิถีชีวิตชุมชน ภูมิปัญญาหัตถกรรมจักสานหวาย และธรรมชาติที่งดงาม",
      is_published: true,
    },
  }).catch(() => {});

  console.log("✅ Seed completed successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
