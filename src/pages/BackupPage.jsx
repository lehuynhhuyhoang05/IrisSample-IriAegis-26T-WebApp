/**
 * Module Sao lưu & Khôi phục – @vantien68
 * Backup chỉ là demo Web (localStorage / tải JSON).
 * Không tương thích mặc định với file backup Android.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  HardDrive,
  Plus,
  Trash2,
  Upload,
  RotateCcw,
  AlertTriangle,
  FileJson,
} from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Notice,
  PageHeader,
  LoadingState,
} from "../ui";
import {
  listBackups,
  createBackup,
  deleteBackup,
  downloadBackupFile,
  validateRestoreFile,
  applyRestore,
  clearAllBackups,
  getBackup,
} from "../services/mockBackupService.js";
import { formatDateTime } from "../services/mockData.js";

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [removing, setRemoving] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreErrors, setRestoreErrors] = useState([]);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => {
    setBackups(listBackups());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function showNotice(tone, message) {
    setNotice({ tone, message });
  }

  async function handleCreate() {
    setBusy(true);
    try {
      const record = await createBackup({ label: label || undefined });
      setLabel("");
      refresh();
      showNotice(
        "success",
        `Đã tạo backup demo “${record.label}”. File chỉ tồn tại trên trình duyệt này.`,
      );
    } catch {
      showNotice("danger", "Không tạo được backup demo.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload(id) {
    const b = getBackup(id);
    if (!b) {
      showNotice("warning", "Không tìm thấy bản sao lưu.");
      return;
    }
    downloadBackupFile(b);
    showNotice("success", `Đã tải file JSON demo của “${b.label}”.`);
  }

  function confirmDelete() {
    deleteBackup(removing.id);
    setRemoving(null);
    refresh();
    showNotice("success", "Đã xóa bản sao lưu demo.");
  }

  async function handlePickRestore(file) {
    if (!file) return;
    setBusy(true);
    setRestorePreview(null);
    setRestoreErrors([]);
    try {
      const result = await validateRestoreFile(file);
      if (!result.ok) {
        setRestoreErrors(result.errors);
        showNotice(
          "danger",
          "File khôi phục không hợp lệ hoặc không phải backup Web demo.",
        );
      } else {
        setRestorePreview(result.preview);
        setConfirmRestore(true);
      }
    } catch {
      showNotice("danger", "Không kiểm tra được file.");
    } finally {
      setBusy(false);
    }
  }

  async function doRestore() {
    setBusy(true);
    try {
      const result = await applyRestore(restorePreview);
      setConfirmRestore(false);
      setRestorePreview(null);
      showNotice("success", result.message);
    } catch {
      showNotice("danger", "Khôi phục giả lập thất bại.");
    } finally {
      setBusy(false);
    }
  }

  function doClearAll() {
    clearAllBackups();
    setConfirmClear(false);
    refresh();
    showNotice("success", "Đã xóa toàn bộ backup demo trên trình duyệt này.");
  }

  const columns = [
    {
      key: "label",
      label: "Bản sao lưu",
      render: (b) => (
        <span>
          <strong>{b.label}</strong>
          <br />
          <small>
            {b.version} · {b.platform}
          </small>
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Tạo lúc",
      render: (b) => formatDateTime(b.createdAt),
    },
    {
      key: "size",
      label: "Kích thước",
      render: (b) => formatBytes(b.sizeEstimate || 0),
    },
    {
      key: "badge",
      label: "Loại",
      render: () => <Badge tone="info">Web demo</Badge>,
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (b) => (
        <div className="ui-row-actions">
          <IconButton
            label={`Tải ${b.label}`}
            icon={Download}
            onClick={() => handleDownload(b.id)}
          />
          <IconButton
            label={`Xóa ${b.label}`}
            icon={Trash2}
            onClick={() => setRemoving(b)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sao lưu & Khôi phục"
        description="Tạo, tải và khôi phục backup demo trên Web."
        actions={
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() =>
              document.getElementById("restore-file-input")?.click()
            }
            disabled={busy}
          >
            Chọn file khôi phục
          </Button>
        }
      />

      <input
        id="restore-file-input"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handlePickRestore(f);
        }}
      />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </Notice>
      )}

      <section
        className="ui-list-section"
        aria-label="Tạo backup mới"
        style={{ marginBottom: "var(--ui-space-6)" }}
      >
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 var(--ui-space-3)" }}>
          <HardDrive
            size={18}
            style={{ verticalAlign: -3, marginRight: 6 }}
            aria-hidden="true"
          />
          Tạo bản sao lưu demo
        </h2>
        <div className="ui-toolbar" style={{ alignItems: "flex-end" }}>
          <Field
            label="Nhãn (tùy chọn)"
            value={label}
            placeholder="Ví dụ: Trước khi demo mentor"
            maxLength={80}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button icon={Plus} onClick={handleCreate} busy={busy}>
            Tạo backup demo
          </Button>
        </div>
      </section>

      <section className="ui-list-section" aria-label="Danh sách backup">
        <div className="ui-toolbar">
          <strong>Danh sách backup trên trình duyệt này</strong>
          <Button
            variant="quiet"
            icon={RotateCcw}
            onClick={() => {
              refresh();
              showNotice("info", "Đã làm mới danh sách từ localStorage.");
            }}
          >
            Làm mới
          </Button>
          {backups.length > 0 && (
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setConfirmClear(true)}
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        {busy && !confirmRestore ? (
          <LoadingState label="Đang xử lý…" />
        ) : (
          <DataTable
            caption="Backup Web demo"
            columns={columns}
            rows={backups}
            empty={
              <EmptyState
                title="Chưa có bản sao lưu"
                action={
                  <Button
                    variant="secondary"
                    icon={Plus}
                    onClick={handleCreate}
                  >
                    Tạo backup đầu tiên
                  </Button>
                }
              >
                Tạo backup demo để thử tải file JSON và luồng khôi phục giả lập.
              </EmptyState>
            }
          />
        )}
      </section>

      {restoreErrors.length > 0 && (
        <Notice tone="danger" title="Lỗi kiểm tra file">
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {restoreErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Notice>
      )}

      {/* Xóa một backup */}
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Xóa bản sao lưu demo?"
        description="Thao tác không thể hoàn tác trong phiên này."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Giữ lại
            </Button>
            <Button variant="danger" icon={Trash2} onClick={confirmDelete}>
              Xóa
            </Button>
          </>
        }
      >
        <p>
          Xóa <strong>{removing?.label}</strong> tạo lúc{" "}
          {formatDateTime(removing?.createdAt)}?
        </p>
      </Dialog>

      {/* Xác nhận khôi phục */}
      <Dialog
        open={confirmRestore}
        onClose={() => {
          setConfirmRestore(false);
          setRestorePreview(null);
        }}
        title="Xác nhận khôi phục (giả lập)"
        description="Chỉ mô phỏng áp dụng trong phiên demo. Không ghi đè dữ liệu server."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmRestore(false);
                setRestorePreview(null);
              }}
            >
              Hủy
            </Button>
            <Button icon={Upload} onClick={doRestore} busy={busy}>
              Khôi phục demo
            </Button>
          </>
        }
      >
        {restorePreview && (
          <div className="ui-form-stack">
            <p>
              <FileJson
                size={18}
                style={{ verticalAlign: -3, marginRight: 6 }}
                aria-hidden="true"
              />
              <strong>{restorePreview.label}</strong>
            </p>
            <p>
              Phiên bản: {restorePreview.version}
              <br />
              Nền tảng: {restorePreview.platform}
              <br />
              Tạo lúc: {formatDateTime(restorePreview.createdAt)}
            </p>
            {restorePreview.note && (
              <Notice tone="info">{restorePreview.note}</Notice>
            )}
            <p style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertTriangle
                size={18}
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span>
                Thao tác nhạy cảm: sau khi xác nhận, hệ thống chỉ{" "}
                <em>mô phỏng</em> khôi phục. Dữ liệu thật trên server không bị
                thay đổi.
              </span>
            </p>
          </div>
        )}
      </Dialog>

      {/* Xóa tất cả */}
      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Xóa toàn bộ backup demo?"
        description="Xóa hết bản ghi trong localStorage của trình duyệt này."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Giữ lại
            </Button>
            <Button variant="danger" icon={Trash2} onClick={doClearAll}>
              Xóa tất cả
            </Button>
          </>
        }
      >
        <p>Hành động này không ảnh hưởng backup Android hay dữ liệu server.</p>
      </Dialog>
    </>
  );
}
