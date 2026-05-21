import './globals.css';

export const metadata = {
  title: 'leet portfolio extractor',
  description: 'Portfolio review app for financial advisors',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
