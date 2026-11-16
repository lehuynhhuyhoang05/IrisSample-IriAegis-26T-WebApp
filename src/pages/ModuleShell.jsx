/**
 * Khung điều hướng tạm cho các module nghiệp vụ tuần 2.
 * Khi trưởng nhóm thống nhất router chính thức sẽ chuyển sang cấu trúc chung.
 */

import { Camera, HardDrive, Mail, Palette, Users } from "lucide-react";
import { AppShell } from "../ui";
import EmailPage from "./EmailPage.jsx";
import BackupPage from "./BackupPage.jsx";
import "../ui/tokens.css";
import "../ui/ui.css";

const items = [
  { id: "email", href: "#/email", label: "Email báo cáo", icon: Mail },
  {
    id: "backup",
    href: "#/backup",
    label: "Sao lưu / Khôi phục",
    icon: HardDrive,
  },
  { id: "ui-kit", href: "#/ui-kit", label: "UI Kit mẫu", icon: Palette },
  { id: "camera", href: "#/camera", label: "Camera prototype", icon: Camera },
];

export default function ModuleShell({ path }) {
  const active = path.startsWith("#/backup")
    ? "backup"
    : path.startsWith("#/email")
      ? "email"
      : "email";

  return (
    <AppShell
      items={items}
      activeId={active}
      brandSubtitle="Web · Nhóm 5"
      navigationLabel="MODULE NGHIỆP VỤ"
      badge="Demo · Giả lập"
      footer={
        <>
          <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
            Email & Backup · dữ liệu mẫu
          </p>
          <p style={{ fontSize: 11, opacity: 0.6, margin: "4px 0 0" }}>
            Chưa kết nối API Nhóm 1
          </p>
        </>
      }
    >
      {active === "email" && <EmailPage />}
      {active === "backup" && <BackupPage />}
    </AppShell>
  );
}
