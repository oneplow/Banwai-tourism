import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { days, interests, startTime, budget, travelers, note } = await request.json();

    // Fetch all active places with categories
    const places = await prisma.place.findMany({
      where: { is_active: true },
      include: {
        categories: {
          include: { category: true },
          orderBy: { is_primary: "desc" },
        },
      },
      orderBy: { view_count: "desc" },
    });

    // Helper to get primary category
    const getPrimary = (p) => {
      const entry = p.categories?.find((c) => c.is_primary) || p.categories?.[0];
      return entry?.category || null;
    };

    const placesContext = places
      .map(
        (p) =>
          `- ${p.name} (${getPrimary(p)?.name || ''}): ${p.description?.slice(0, 200) || ""} | เวลา: ${p.open_hours || "ตลอดวัน"} | ที่อยู่: ${p.address || ""}`
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
- จำนวนผู้เดินทาง: ${travelers || 2} คน
${note ? `- หมายเหตุพิเศษ: ${note}` : ""}

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
  "tips": ["เคล็ดลับการเดินทาง 1", "เคล็ดลับ 2"]
}

สำคัญมาก:
- ชื่อสถานที่ (place_name) ต้องตรงกับรายการสถานที่ด้านบนเท่านั้น ห้ามแต่งขึ้นเอง
- เขียนสรุป (summary), กิจกรรม (activity), และเคล็ดลับ (tip) ให้ **สั้นและกระชับที่สุด (ไม่เกิน 1 ประโยค)** เพื่อป้องกันข้อมูลล้น
- ตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น`;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return NextResponse.json(getMockPlan(places, parseInt(days) || 1, getPrimary));
    }

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
    });
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    let geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: geminiBody,
    });

    // Retry once after delay if rate-limited or service unavailable
    if (geminiRes.status === 429 || geminiRes.status === 503) {
      console.log(`Gemini API returned ${geminiRes.status}, retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: geminiBody,
      });
    }

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorBody);
      const mock = getMockPlan(places, parseInt(days) || 1, getPrimary);
      mock._isMock = true;
      return NextResponse.json(mock);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw response (first 500):", rawText.slice(0, 500));
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message, "Raw:", cleaned.slice(0, 300));
      const mock = getMockPlan(places, parseInt(days) || 1, getPrimary);
      mock._isMock = true;
      return NextResponse.json(mock);
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
          category_icon: getPrimary(match)?.icon || null,
          cover_image: match?.cover_image || null,
          open_hours: match?.open_hours || null,
        };
      }),
    }));

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Trip planner error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

function getMockPlan(places, days, getPrimary) {
  const makeItem = (p, hour) => ({
    time: `${String(hour).padStart(2, '0')}:00`,
    place_name: p.name,
    place_id: p.place_id,
    category_icon: getPrimary?.(p)?.icon || (p.categories?.find((c) => c.is_primary)?.category || p.categories?.[0]?.category)?.icon || null,
    cover_image: p.cover_image || null,
    open_hours: p.open_hours || null,
    activity: `เยี่ยมชม${p.name}`,
    duration: "1-2 ชั่วโมง",
    tip: null,
  });

  const placesPerDay = Math.max(2, Math.ceil(places.length / days));
  const titles = ["สำรวจวิถีชุมชน", "ท่องเที่ยวเชิงวัฒนธรรม", "ชมธรรมชาติ", "เที่ยววัดและประวัติศาสตร์", "ตลาดและหัตถกรรม", "พักผ่อนชมวิว", "ปิดทริปประทับใจ"];

  return {
    summary: `แผนทริปบ้านหวาย ${days} วัน สัมผัสวิถีชุมชนและวัฒนธรรมท้องถิ่น (ข้อมูลตัวอย่าง — กรุณาตั้งค่า GEMINI_API_KEY ให้ถูกต้องเพื่อใช้ AI วางแผนจริง)`,
    days: Array.from({ length: days }, (_, dayIdx) => {
      const startIdx = (dayIdx * placesPerDay) % places.length;
      const dayPlaces = [];
      for (let j = 0; j < placesPerDay && dayPlaces.length < places.length; j++) {
        dayPlaces.push(places[(startIdx + j) % places.length]);
      }
      return {
        day: dayIdx + 1,
        title: titles[dayIdx % titles.length],
        schedule: dayPlaces.map((p, j) => makeItem(p, 8 + j * 2)),
      };
    }),
    tips: [
      "เดินทางช่วงเช้าเพื่อหลีกเลี่ยงอากาศร้อน",
      "ลองอาหารท้องถิ่นที่ตลาดชุมชน",
      "ซื้อผลิตภัณฑ์หัตถกรรมเป็นของฝาก",
    ],
  };
}
