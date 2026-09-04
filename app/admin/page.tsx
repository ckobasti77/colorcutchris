import type { Metadata } from "next";
import { admin } from "@/components/booking/strings";
import AdminPanel from "./AdminPanel";

/** /admin — Chrisov panel. Nikad u indeksu; ključ se unosi u samom panelu (Convex `ADMIN_KEY`). */
export const metadata: Metadata = {
  title: admin.title,
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminPanel />;
}
