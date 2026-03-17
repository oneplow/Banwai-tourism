const fs = require('fs');
const path = require('path');

const fileReplacements = [
  { file: 'src/components/ReviewForm.js', search: 'import { useState } from "react";\r\nimport { useState } from "react";', replace: 'import { useState } from "react";' },
  { file: 'src/components/ReviewForm.js', search: 'import { useState } from "react";\nimport { useState } from "react";', replace: 'import { useState } from "react";' },
  { file: 'src/app/announcements/page.js', search: 'import Navbar from "@/components/Navbar";\r\nimport Navbar from "@/components/Navbar";', replace: 'import Navbar from "@/components/Navbar";' },
  { file: 'src/app/announcements/page.js', search: 'import Navbar from "@/components/Navbar";\nimport Navbar from "@/components/Navbar";', replace: 'import Navbar from "@/components/Navbar";' },
  { file: 'src/app/not-found.js', search: 'import Link from "next/link";\r\nimport Link from "next/link";', replace: 'import Link from "next/link";' },
  { file: 'src/app/not-found.js', search: 'import Link from "next/link";\nimport Link from "next/link";', replace: 'import Link from "next/link";' },
  { file: 'src/app/page.js', search: 'import Navbar from "@/components/Navbar";\r\nimport Navbar from "@/components/Navbar";', replace: 'import Navbar from "@/components/Navbar";' },
  { file: 'src/app/page.js', search: 'import Navbar from "@/components/Navbar";\nimport Navbar from "@/components/Navbar";', replace: 'import Navbar from "@/components/Navbar";' },
  { file: 'src/app/places/page.js', search: 'import PlaceCard from "@/components/PlaceCard";\r\nimport PlaceCard from "@/components/PlaceCard";', replace: 'import PlaceCard from "@/components/PlaceCard";' },
  { file: 'src/app/places/page.js', search: 'import PlaceCard from "@/components/PlaceCard";\nimport PlaceCard from "@/components/PlaceCard";', replace: 'import PlaceCard from "@/components/PlaceCard";' },
  { file: 'src/components/PlaceCard.js', search: 'import Link from "next/link";\r\nimport Link from "next/link";', replace: 'import Link from "next/link";' },
  { file: 'src/components/PlaceCard.js', search: 'import Link from "next/link";\nimport Link from "next/link";', replace: 'import Link from "next/link";' },
];

fileReplacements.forEach(({ file, search, replace }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(filePath, content);
  }
});
