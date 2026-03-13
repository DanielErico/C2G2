import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
      <Analytics />
    </AuthProvider>
  );
}
