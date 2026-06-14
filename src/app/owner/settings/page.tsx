import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const dbSettings = await prisma.setting.findMany();
  
  // Convert array of settings into key-value pairs
  const settingsMap: Record<string, string> = {};
  for (const s of dbSettings) {
    settingsMap[s.key] = s.value;
  }

  return <SettingsClient settings={settingsMap} />;
}

