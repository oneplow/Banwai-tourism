import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { days, interests, startTime, budget } = await request.json();

    // Fetch all active places with categories
    const places = await prisma.place.findMany({
      where: { is_active: true },
      include: { category: true },
      orderBy: { view_count: "desc" },
    });

    const placesContext = places
      .map(
        (p) =>
          `- ${p.name} (${p.category?.name}): ${p.description?.slice(0, 100) || ""} | เวลา: ${p.open_hours || "ตลอดวัน"} | ที่อยู่: ${p.address || ""}`
      )
      .join("\n");

    const prompt = `คุณคือไกด์ท้องถิ่นของตำบลบ้านหวาย ช่วยวางแผนทริปให้นักท่องเที่ยว

ข้อมูลสถานที่ท่องเที่ยวในตำบลบ้านหวาย:
${placesContext}

ความต้องการของนักท่องเที่ยว:
- จำนวนวัน: ${days || 1} วัน
- ความสนใจ: ${interests || "ทั่วไป"}
- เวลาเริ่ม: ${startTime || "08:00"}
- งบประมาณ: ${budget || "ปานกลาง"}

กรุณาวางแผนทริปเป็น JSON เท่านั้น ตามรูปแบบนี้:
{
  "summary": "สรุปทริปสั้นๆ 1-2 ประโยค",
  "days": [
    {
      "day": 1,
      "title": "ชื่อธีมวันนี้",
      "schedule": [
        {
          "time": "08:00",
          "place_name": "ชื่อสถานที่ (ต้องตรงกับรายการข้างบน)",
          "activity": "กิจกรรมที่ทำ",
          "duration": "1 ชั่วโมง",
          "tip": "เคล็ดลับสั้นๆ"
        }
      ]
    }
  ],
  "tips": ["เคล็ดลับการเดินทาง 1", "เคล็ดลับ 2", "เคล็ดลับ 3"]
}

ตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น`;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      // Return mock data if no API key
      return NextResponse.json(getMockPlan(places, parseInt(days) || 1));
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json(getMockPlan(places, parseInt(days) || 1));
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch {
      plan = getMockPlan(places, parseInt(days) || 1);
    }

    // Enrich with place data from DB
    plan.days = plan.days?.map((day) => ({
      ...day,
      schedule: day.schedule?.map((item) => {
        const match = places.find(
          (p) => p.name.trim() === item.place_name?.trim()
        );
        return {
          ...item,
          place_id: match?.place_id || null,
          category_icon: match?.category?.icon || null,
        };
      }),
    }));

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Trip planner error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

function getMockPlan(places, days) {
  const scheduleItems = places.slice(0, Math.min(places.length, 3)).map((p, i) => ({
    time: `${8 + i * 2}:00`,
    place_name: p.name,
    place_id: p.place_id,
    category_icon: p.category?.icon || null,
    activity: `เยี่ยมชม${p.name}`,
    duration: "1-2 ชั่วโมง",
    tip: p.description?.slice(0, 60) || "สถานที่น่าสนใจในชุมชน",
  }));

  return {
    summary: `แผนทริปบ้านหวาย ${days} วัน สัมผัสวิถีชุมชนและวัฒนธรรมท้องถิ่น (ตัวอย่าง — เพิ่ม GEMINI_API_KEY เพื่อใช้ AI จริง)`,
    days: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      title: i === 0 ? "วันแรก: สำรวจชุมชน" : `วันที่ ${i + 1}: ท่องเที่ยวต่อ`,
      schedule: i === 0 ? scheduleItems : scheduleItems.slice(0, 2),
    })),
    tips: [
      "เดินทางช่วงเช้าเพื่อหลีกเลี่ยงอากาศร้อน",
      "ลองอาหารท้องถิ่นที่ตลาดชุมชน",
      "ซื้อผลิตภัณฑ์หัตถกรรมเป็นของฝาก",
    ],
  };
}
