import PaymentMethodPage from "@/components/wallet/PaymentMethodPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Phương Thức Thanh Toán | Phim ngắn hay",
  "/wallet/payment-methods",
);

export default function PaymentMethodRoute() {
  return <PaymentMethodPage />;
}
