/**
 * Module Email báo cáo – @vantien68
 * Dữ liệu & gửi email đều giả lập. Không gửi email thật.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Pencil,
  Mail,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  Eye,
  History,
  Users,
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
  SearchField,
  LoadingState,
} from "../ui";
import {
  getSubjects,
  getReportSummaries,
  getRecipients,
  addRecipient,
  updateRecipient,
  removeRecipient,
  importRecipientsFromCsv,
  getSendHistory,
  sendReportEmail,
  buildEmailPreview,
  resetEmailMockData,
} from "../services/mockEmailService.js";
import { parseRecipientsCsv } from "../services/csvRecipients.js";
import { formatDateTime } from "../services/mockData.js";

const ROLES = [
  { value: "Giảng viên", label: "Giảng viên" },
  { value: "Trợ giảng", label: "Trợ giảng" },
  { value: "Phòng ban", label: "Phòng ban" },
  { value: "Khác", label: "Khác" },
];

export default function EmailPage() {
  const subjects = useMemo(() => getSubjects(), []);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [recipients, setRecipients] = useState([]);
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("recipients"); // recipients | compose | history
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Dialogs
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [compose, setCompose] = useState({ reportId: "", selectedIds: [] });

  const refresh = useCallback(() => {
    setRecipients(getRecipients(subjectId));
    setReports(getReportSummaries(subjectId));
    setHistory(getSendHistory());
  }, [subjectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredRecipients = recipients.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${r.name} ${r.email} ${r.role}`.toLowerCase().includes(q);
  });

  function showNotice(tone, message) {
    setNotice({ tone, message });
  }

  function openAdd() {
    setErrors({});
    setEditing({ id: null, name: "", email: "", role: "Giảng viên" });
  }

  function openEdit(r) {
    setErrors({});
    setEditing({ ...r });
  }

  function saveRecipient(e) {
    e.preventDefault();
    const name = editing.name.trim();
    const email = editing.email.trim().toLowerCase();
    const next = {};
    if (name.length < 2) next.name = "Nhập họ tên từ 2 ký tự.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Email không hợp lệ.";
    else if (recipients.some((r) => r.email === email && r.id !== editing.id)) {
      next.email = "Email này đã có trong danh sách môn hiện tại.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    if (editing.id) {
      updateRecipient(editing.id, { name, email, role: editing.role });
      showNotice("success", `Đã cập nhật người nhận ${name} (dữ liệu mẫu).`);
    } else {
      addRecipient({ subjectId, name, email, role: editing.role });
      showNotice("success", `Đã thêm người nhận ${name} (dữ liệu mẫu).`);
    }
    setEditing(null);
    refresh();
  }

  function confirmRemove() {
    removeRecipient(removing.id);
    showNotice("success", `Đã xóa người nhận mẫu ${removing.name}.`);
    setRemoving(null);
    refresh();
  }

  async function handleImportCsv(file) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseRecipientsCsv(text);
      if (!rows.length) {
        showNotice("warning", "File CSV trống, không có dòng nào để nhập.");
        return;
      }
      const { added, errors: importErrors } = importRecipientsFromCsv(
        subjectId,
        rows,
      );
      refresh();
      if (added.length) {
        showNotice(
          "success",
          `Đã nhập ${added.length} người nhận từ CSV (demo).${importErrors.length ? ` ${importErrors.length} dòng bị bỏ qua.` : ""}`,
        );
      } else {
        showNotice(
          "warning",
          importErrors[0] || "Không có dòng hợp lệ để nhập.",
        );
      }
    } catch {
      showNotice("danger", "Không đọc được file CSV.");
    } finally {
      setBusy(false);
    }
  }

  function exportRecipientsCsv() {
    const cell = (v) => `"${String(v).replaceAll('"', '""')}"`;
    const csv =
      "\uFEFF" +
      [
        ["Họ tên", "Email", "Vai trò"],
        ...filteredRecipients.map((r) => [r.name, r.email, r.role]),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `nguoi-nhan-${subjectId}-mau.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice(
      "success",
      "Đã tạo file CSV người nhận từ danh sách đang hiển thị.",
    );
  }

  function openCompose() {
    const firstReport = reports[0];
    setCompose({
      reportId: firstReport?.id || "",
      selectedIds: recipients.map((r) => r.id),
    });
    setTab("compose");
  }

  function toggleRecipient(id) {
    setCompose((prev) => {
      const has = prev.selectedIds.includes(id);
      return {
        ...prev,
        selectedIds: has
          ? prev.selectedIds.filter((x) => x !== id)
          : [...prev.selectedIds, id],
      };
    });
  }

  function doPreview() {
    const report = reports.find((r) => r.id === compose.reportId);
    if (!report) {
      showNotice("warning", "Chọn một báo cáo mẫu.");
      return;
    }
    const selected = recipients.filter((r) =>
      compose.selectedIds.includes(r.id),
    );
    if (!selected.length) {
      showNotice("warning", "Chọn ít nhất một người nhận.");
      return;
    }
    setPreview(buildEmailPreview(report, selected));
  }

  async function doSend(forceFail = false) {
    const report = reports.find((r) => r.id === compose.reportId);
    if (!report || !compose.selectedIds.length) {
      showNotice("warning", "Chọn báo cáo và ít nhất một người nhận.");
      return;
    }
    setBusy(true);
    setPreview(null);
    try {
      const entry = await sendReportEmail({
        reportId: compose.reportId,
        recipientIds: compose.selectedIds,
        forceFail,
      });
      refresh();
      setTab("history");
      showNotice(entry.status === "success" ? "success" : "danger", entry.note);
    } catch (err) {
      showNotice("danger", err.message || "Gửi thất bại (giả lập).");
    } finally {
      setBusy(false);
    }
  }

  const recipientColumns = [
    {
      key: "name",
      label: "Người nhận",
      render: (r) => (
        <div className="ui-person">
          <span className="ui-initials" aria-hidden="true">
            {r.name
              .split(" ")
              .slice(-2)
              .map((p) => p[0])
              .join("")}
          </span>
          <span>
            <strong>{r.name}</strong>
            <small>{r.email}</small>
          </span>
        </div>
      ),
    },
    { key: "role", label: "Vai trò" },
    {
      key: "actions",
      label: "Thao tác",
      render: (r) => (
        <div className="ui-row-actions">
          <IconButton
            label={`Sửa ${r.name}`}
            icon={Pencil}
            onClick={() => openEdit(r)}
          />
          <IconButton
            label={`Xóa ${r.name}`}
            icon={Trash2}
            onClick={() => setRemoving(r)}
          />
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: "session",
      label: "Báo cáo",
      render: (h) => (
        <span>
          <strong>{h.subjectName}</strong>
          <br />
          <small>{h.session}</small>
        </span>
      ),
    },
    {
      key: "recipients",
      label: "Người nhận",
      render: (h) => h.recipients.join(", "),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (h) => (
        <Badge tone={h.status === "success" ? "success" : "danger"}>
          {h.status === "success" ? "Thành công (demo)" : "Thất bại (demo)"}
        </Badge>
      ),
    },
    {
      key: "sentAt",
      label: "Thời gian",
      render: (h) => formatDateTime(h.sentAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Email báo cáo"
        description="Quản lý người nhận theo môn, xem trước nội dung và gửi email báo cáo điểm danh ."
        actions={
          <div className="ui-actions">
            <Button
              variant="secondary"
              icon={History}
              onClick={() => setTab("history")}
            >
              Lịch sử gửi
            </Button>
            <Button
              icon={Send}
              onClick={openCompose}
              disabled={!recipients.length || !reports.length}
            >
              Soạn & gửi
            </Button>
          </div>
        }
      />
      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </Notice>
      )}

      <div className="ui-toolbar" style={{ marginBottom: "var(--ui-space-4)" }}>
        <Field
          label="Môn học"
          as="select"
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setQuery("");
            setTab("recipients");
          }}
          options={subjects.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.code})`,
          }))}
        />
        <div
          style={{
            display: "flex",
            gap: "var(--ui-space-2)",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant={tab === "recipients" ? "primary" : "secondary"}
            icon={Users}
            onClick={() => setTab("recipients")}
          >
            Người nhận
          </Button>
          <Button
            variant={tab === "compose" ? "primary" : "secondary"}
            icon={Mail}
            onClick={openCompose}
          >
            Soạn gửi
          </Button>
          <Button
            variant={tab === "history" ? "primary" : "secondary"}
            icon={History}
            onClick={() => setTab("history")}
          >
            Lịch sử
          </Button>
        </div>
      </div>

      {tab === "recipients" && (
        <section className="ui-list-section" aria-label="Danh sách người nhận">
          <div className="ui-toolbar">
            <SearchField
              label="Tìm tên hoặc email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button icon={Plus} onClick={openAdd}>
              Thêm người nhận
            </Button>
            <label
              className="ui-button ui-button--secondary"
              style={{ cursor: "pointer" }}
            >
              <Upload size={18} aria-hidden="true" />
              Nhập CSV
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) handleImportCsv(f);
                }}
              />
            </label>
            <Button
              variant="secondary"
              icon={Download}
              onClick={exportRecipientsCsv}
              disabled={!filteredRecipients.length}
            >
              Xuất CSV
            </Button>
          </div>

          {busy ? (
            <LoadingState label="Đang xử lý CSV…" />
          ) : (
            <DataTable
              caption="Người nhận báo cáo theo môn"
              columns={recipientColumns}
              rows={filteredRecipients}
              empty={
                <EmptyState
                  title={
                    recipients.length
                      ? "Không tìm thấy người nhận"
                      : "Chưa có người nhận"
                  }
                  action={
                    <Button
                      variant="secondary"
                      onClick={recipients.length ? () => setQuery("") : openAdd}
                    >
                      {recipients.length ? "Xóa tìm kiếm" : "Thêm người nhận"}
                    </Button>
                  }
                >
                  {recipients.length
                    ? "Thử từ khóa khác hoặc đổi môn học."
                    : "Thêm người nhận hoặc nhập CSV để thử luồng email demo."}
                </EmptyState>
              }
            />
          )}

          <div className="ui-list-footer">
            <span>
              Hiển thị <strong>{filteredRecipients.length}</strong> /{" "}
              {recipients.length} người nhận
            </span>
            <Button
              variant="quiet"
              icon={RotateCcw}
              onClick={() => {
                resetEmailMockData();
                refresh();
                showNotice(
                  "success",
                  "Đã khôi phục dữ liệu người nhận & lịch sử mẫu.",
                );
              }}
            >
              Đặt lại mẫu
            </Button>
          </div>
          <p className="ui-hint" style={{ marginTop: "var(--ui-space-3)" }}>
            CSV: cột <code>Email</code> bắt buộc; <code>Họ tên</code>,{" "}
            <code>Vai trò</code> tùy chọn. Nhận dấu , hoặc ; và có thể không có
            dòng tiêu đề.
          </p>
        </section>
      )}

      {tab === "compose" && (
        <section className="ui-list-section" aria-label="Soạn email báo cáo">
          {!reports.length ? (
            <EmptyState title="Chưa có báo cáo mẫu cho môn này"></EmptyState>
          ) : (
            <>
              <Field
                label="Chọn báo cáo điểm danh"
                as="select"
                value={compose.reportId}
                onChange={(e) =>
                  setCompose((p) => ({ ...p, reportId: e.target.value }))
                }
                options={reports.map((r) => ({
                  value: r.id,
                  label: `${r.session} · Có mặt ${r.present}/${r.total}`,
                }))}
              />

              <div style={{ marginTop: "var(--ui-space-4)" }}>
                <strong>
                  Người nhận ({compose.selectedIds.length}/{recipients.length})
                </strong>
                <div
                  style={{
                    display: "grid",
                    gap: "var(--ui-space-2)",
                    marginTop: "var(--ui-space-3)",
                    maxHeight: 240,
                    overflow: "auto",
                  }}
                >
                  {recipients.map((r) => (
                    <label
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--ui-space-3)",
                        padding: "var(--ui-space-2) var(--ui-space-3)",
                        border: "1px solid var(--ui-border)",
                        borderRadius: "var(--ui-radius-md)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={compose.selectedIds.includes(r.id)}
                        onChange={() => toggleRecipient(r.id)}
                      />
                      <span>
                        <strong>{r.name}</strong> · {r.email}
                        <br />
                        <small className="ui-muted">{r.role}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div
                className="ui-actions"
                style={{ marginTop: "var(--ui-space-5)", flexWrap: "wrap" }}
              >
                <Button
                  variant="secondary"
                  icon={Eye}
                  onClick={doPreview}
                  disabled={busy}
                >
                  Xem trước
                </Button>
                <Button icon={Send} onClick={() => doSend(false)} busy={busy}>
                  Gửi (giả lập thành công/ngẫu nhiên)
                </Button>
                <Button
                  variant="danger"
                  onClick={() => doSend(true)}
                  disabled={busy}
                >
                  Mô phỏng gửi thất bại
                </Button>
              </div>

              <Notice tone="info" title="Giả lập">
                Nút gửi chỉ ghi lịch sử trong trình duyệt. Không có SMTP hay API
                email thật. Khi có đặc tả Nhóm 1 sẽ thay bằng gọi API.
              </Notice>
            </>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="ui-list-section" aria-label="Lịch sử gửi email">
          <DataTable
            caption="Lịch sử gửi báo cáo (demo)"
            columns={historyColumns}
            rows={history}
            empty={
              <EmptyState title="Chưa có lần gửi nào">
                Soạn và gửi một báo cáo mẫu để thấy lịch sử giả lập.
              </EmptyState>
            }
          />
        </section>
      )}

      {/* Dialog thêm/sửa người nhận */}
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Sửa người nhận" : "Thêm người nhận"}
        description="Thông tin chỉ lưu trong phiên demo, không đồng bộ server."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button type="submit" form="recipient-form">
              Lưu
            </Button>
          </>
        }
      >
        {editing && (
          <form
            id="recipient-form"
            className="ui-form-stack"
            onSubmit={saveRecipient}
            noValidate
          >
            <Field
              autoFocus
              label="Họ và tên"
              required
              value={editing.name}
              error={errors.name}
              maxLength={100}
              onChange={(e) =>
                setEditing((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Field
              label="Email"
              required
              type="email"
              value={editing.email}
              error={errors.email}
              maxLength={120}
              onChange={(e) =>
                setEditing((p) => ({ ...p, email: e.target.value }))
              }
            />
            <Field
              label="Vai trò"
              as="select"
              value={editing.role}
              options={ROLES}
              onChange={(e) =>
                setEditing((p) => ({ ...p, role: e.target.value }))
              }
            />
          </form>
        )}
      </Dialog>

      {/* Xác nhận xóa */}
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Xóa người nhận mẫu?"
        description="Chỉ ảnh hưởng dữ liệu minh họa trên trang này."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Giữ lại
            </Button>
            <Button variant="danger" icon={Trash2} onClick={confirmRemove}>
              Xóa
            </Button>
          </>
        }
      >
        <p>
          Bạn đang xóa <strong>{removing?.name}</strong> ({removing?.email}).
        </p>
      </Dialog>

      {/* Xem trước email */}
      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Xem trước email (giả lập)"
        description="Nội dung sẽ được gửi tới server email khi có API. Hiện chỉ xem trong trình duyệt."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Đóng
            </Button>
            <Button
              icon={Send}
              onClick={() => {
                setPreview(null);
                doSend(false);
              }}
              busy={busy}
            >
              Gửi ngay (demo)
            </Button>
          </>
        }
      >
        {preview && (
          <div className="ui-form-stack">
            <p>
              <strong>Tới:</strong> {preview.to}
            </p>
            <p>
              <strong>Tiêu đề:</strong> {preview.subject}
            </p>
            <p>
              <strong>Đính kèm:</strong> {preview.attachmentName}
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                background: "var(--ui-canvas)",
                padding: "var(--ui-space-3)",
                borderRadius: "var(--ui-radius-md)",
                border: "1px solid var(--ui-border)",
                maxHeight: 280,
                overflow: "auto",
              }}
            >
              {preview.body}
            </pre>
          </div>
        )}
      </Dialog>
    </>
  );
}
