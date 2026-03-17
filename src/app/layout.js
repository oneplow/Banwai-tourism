import "./globals.css";

export const metadata = {
  title: "บ้านหวาย - แหล่งท่องเที่ยวตำบลบ้านหวาย",
  description: "ค้นพบสถานที่ท่องเที่ยว วัฒนธรรม และวิถีชีวิตชุมชนตำบลบ้านหวาย",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;600;700&family=Sarabun:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
