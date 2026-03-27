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
      password: hashedPassword,
      role: "admin",
    },
  });

  // Seed categories
  const categories = [
    { name: "วัด / ศาสนสถาน", icon: "🛕", sort_order: 1 },
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
  ];

  for (const place of places) {
    await prisma.place.create({ data: place }).catch(() => { });
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
  }).catch(() => { });

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
