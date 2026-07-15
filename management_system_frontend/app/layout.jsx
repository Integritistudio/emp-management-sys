import "./globals.css";

export const metadata = {
  title: "Integriti Management System",
  description: "Integriti Employee Management System",
  icons: {
    icon: "/images/logo.webp",
    apple: "/images/logo.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
