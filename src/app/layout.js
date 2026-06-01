import "./globals.css";
import ThemeErrorBoundary from "@/components/ThemeErrorBoundary"
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "低谷渡口—你不是一个人",
  description: "一个给负债、失业、想逃离原生家庭的人们的安静社群。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{background:"#faf6f0"}}>
        <ThemeErrorBoundary><ThemeProvider><ClientLayout>
          <div className="page-wrap">{children}</div>
        </ClientLayout></ThemeProvider></ThemeErrorBoundary>
      </body>
    </html>
  );
}
