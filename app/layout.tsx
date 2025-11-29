export const metadata = {
  title: "Auto Scroller",
  description: "Automatically scroll webpages with controls and bookmarklets."
};

import "./globals.css";
import React from "react";

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}
