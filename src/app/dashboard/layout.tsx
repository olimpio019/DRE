import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <WhatsAppButton phoneNumber="5519993993659" />
    </div>
  );
} 