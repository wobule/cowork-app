export default function PdfEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
