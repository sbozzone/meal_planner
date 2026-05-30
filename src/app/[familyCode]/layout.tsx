import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { FamilyProvider } from "@/lib/family-context";
import { BottomNav } from "@/components/layout/BottomNav";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ familyCode: string }>;
}) {
  const { familyCode } = await params;
  const supabase = createServerClient();
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("share_code", familyCode)
    .single();

  return {
    title: family ? `${family.name} | DinnerTime` : "Family DinnerTime",
  };
}

export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ familyCode: string }>;
}) {
  const { familyCode } = await params;
  const supabase = createServerClient();

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("share_code", familyCode)
    .single();

  if (!family) notFound();

  return (
    <FamilyProvider family={family}>
      <div className="min-h-dvh pb-28">
        {children}
      </div>
      <BottomNav familyCode={familyCode} />
    </FamilyProvider>
  );
}
