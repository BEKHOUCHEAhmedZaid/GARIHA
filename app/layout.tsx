import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "GARIHA — Smart Urban Parking",
  description: "Find available parking spaces in real time or turn your spot into an opportunity. The future of urban parking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
