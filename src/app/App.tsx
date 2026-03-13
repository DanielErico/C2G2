import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
      <Analytics />
    </>
  );
}
