import { create } from "zustand"

/**
 * Lưu ảnh vừa chụp và kết quả gửi lên server.
 * Dùng chung giữa các trang (ví dụ chụp ở trang Điểm danh, xem lại ở trang khác).
 */
export const useCheckinStore = create((set, get) => ({
  photo: null, // { blob, url, width, height }
  result: null, // { ok: boolean, message: string }

  setPhoto: (photo) => {
    const old = get().photo
    if (old?.url && old.url !== photo?.url) URL.revokeObjectURL(old.url)
    set({ photo, result: null })
  },
  setResult: (result) => set({ result }),
  clear: () => {
    const old = get().photo
    if (old?.url) URL.revokeObjectURL(old.url)
    set({ photo: null, result: null })
  },
}))
