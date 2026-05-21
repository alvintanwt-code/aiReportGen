import './globals.css';

export const metadata = {
  title: 'AI Report Generator',
  description: 'Portfolio review app for financial advisors',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
