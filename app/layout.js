import "./globals.css";

export const metadata = {
  title: "先海",
  description: "2D illustration · limited fine art prints",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
