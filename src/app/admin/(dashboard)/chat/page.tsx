import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { encrypt } from "@/lib/auth";
import AdminChatClient from "@/components/admin/chat/AdminChatClient";

export default async function AdminChatPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  // Create a short-lived token for socket auth
  const token = await encrypt({
    userId: session.userId,
    name: "Admin",
    role: "admin",
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Live Chat</h1>
        <p className="text-gray-400 text-sm mt-1">
          Chăm sóc khách hàng theo thời gian thực
        </p>
      </div>
      <AdminChatClient adminToken={token} />
    </div>
  );
}
