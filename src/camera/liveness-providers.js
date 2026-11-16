import { predictLiveness } from '../liveness/client.js'

/**
 * Điểm tích hợp liveness cho FaceCamera.
 *
 * Provider = {
 *   id: string,
 *   label: string,              // hiển thị cho người dùng
 *   simulated: boolean,         // true => UI luôn gắn nhãn GIẢ LẬP
 *   mode: 'photo' | 'stream',   // photo: kiểm tra ảnh sau khi chụp, camera đã tắt
 *                               // stream: kiểm tra khi camera còn mở (dùng chung stream/video)
 *   mirror?: boolean,           // photo: false = nhận ảnh hướng gốc của camera (mặc định lật gương)
 *   check(input) => Promise<LivenessOutcome>
 * }
 *
 * input = { blob, dataUrl, width, height, stream, video, signal }
 *   - mode 'photo': có blob/dataUrl; stream/video là null.
 *   - mode 'stream': có stream/video đang chạy; blob là null. Không tự stop track.
 *
 * LivenessOutcome = {
 *   verdict: 'pass' | 'fail',
 *   simulated: boolean,
 *   source: string,             // id provider
 *   message?: string,           // giải thích ngắn khi fail
 *   scores?: { real, spoof, threshold },
 *   raw?: unknown,              // dữ liệu gốc của module để lưu/debug
 * }
 * Lỗi kết nối/dịch vụ: throw Error (UI hiển thị trạng thái "error" và cho thử lại).
 *
 * Phát hiện khuôn mặt KHÔNG phải liveness. Provider chỉ trả "pass" khi module
 * liveness (thật hoặc giả lập có nhãn) trả kết quả.
 */

export const LIVENESS_STATES = Object.freeze(['idle', 'checking', 'passed', 'failed', 'error'])

export function isProvider(value) {
  return Boolean(value && typeof value.check === 'function' && typeof value.id === 'string' &&
    typeof value.simulated === 'boolean' && ['photo', 'stream'].includes(value.mode))
}

/** Kiểm tra kết quả provider trả về; chặn provider giả lập tự nhận là thật. */
export function normalizeOutcome(outcome, provider) {
  if (!outcome || !['pass', 'fail'].includes(outcome.verdict)) throw new Error('Module liveness trả kết quả không hợp lệ.')
  return Object.freeze({
    verdict: outcome.verdict,
    simulated: provider.simulated || Boolean(outcome.simulated),
    source: provider.id,
    message: typeof outcome.message === 'string' ? outcome.message : '',
    scores: outcome.scores ? Object.freeze({ ...outcome.scores }) : null,
    raw: outcome.raw ?? null,
  })
}

/** Gọi provider và trả trạng thái UI: { state: 'passed'|'failed'|'error', outcome?, error? }. */
export async function runLivenessCheck(provider, input) {
  try {
    const outcome = normalizeOutcome(await provider.check(input), provider)
    return { state: outcome.verdict === 'pass' ? 'passed' : 'failed', outcome }
  } catch (error) {
    if (input?.signal?.aborted || error?.name === 'AbortError') return { state: 'aborted' }
    return { state: 'error', error: error?.message || 'Chưa kiểm tra được liveness. Hãy thử lại.' }
  }
}

/**
 * Dịch vụ liveness Nhóm 4 qua HTTP (POST /api/v1/predict-liveness).
 * Gửi ảnh đã chụp; kết quả REAL/FAKE do server quyết định.
 * Lưu ý: luồng đầy đủ (chớp mắt, quay đầu, flash) vẫn là FullLivenessCamera.
 */
export function createGroup4PhotoProvider({ predict = predictLiveness, baseURL } = {}) {
  return Object.freeze({
    id: 'group4-photo',
    label: 'Dịch vụ liveness Nhóm 4 (ảnh)',
    simulated: false,
    mode: 'photo',
    // Giữ hướng gốc như prototype trước đây gửi cho model của Nhóm 4.
    mirror: false,
    async check({ blob, signal }) {
      const result = await predict(blob, { signal, ...(baseURL ? { baseURL } : {}) })
      return {
        verdict: result.is_real ? 'pass' : 'fail',
        message: result.is_real ? '' : 'Dịch vụ Nhóm 4 đánh giá ảnh không đạt liveness. Hãy chụp lại.',
        scores: { real: result.real_score, spoof: result.spoof_score, threshold: result.threshold_used },
        raw: result,
      }
    },
  })
}

export const SIMULATED_SCENARIOS = Object.freeze([
  { value: 'pass', label: 'Giả lập: đạt' },
  { value: 'fail', label: 'Giả lập: không đạt' },
  { value: 'error', label: 'Giả lập: lỗi kết nối' },
])

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(new DOMException('Đã hủy kiểm tra', 'AbortError')); return }
  const timer = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Đã hủy kiểm tra', 'AbortError')) }, { once: true })
})

/**
 * Provider giả lập để demo/test khi chưa có module thật.
 * scenario: 'pass' | 'fail' | 'error' hoặc hàm (input) => scenario.
 * Không phân tích ảnh, không gửi ảnh đi đâu.
 */
export function createSimulatedProvider({ scenario = 'pass', delay = 900, mode = 'photo', sleep = wait } = {}) {
  return Object.freeze({
    id: `simulated-${mode}`,
    label: 'Liveness giả lập',
    simulated: true,
    mode,
    async check(input) {
      await sleep(delay, input?.signal)
      const result = typeof scenario === 'function' ? scenario(input) : scenario
      if (result === 'error') throw new Error('Giả lập: không kết nối được module liveness. Hãy thử lại.')
      if (result === 'fail') return { verdict: 'fail', simulated: true, message: 'Giả lập: không đạt liveness. Hãy chụp lại.' }
      return { verdict: 'pass', simulated: true }
    },
  })
}
