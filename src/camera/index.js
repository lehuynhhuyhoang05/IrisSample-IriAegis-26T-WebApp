// Điểm import duy nhất cho camera dùng chung. Xem HUONG-DAN-CAMERA.md.
export { default as FaceCamera } from './FaceCamera.jsx'
export { useCamera } from './useCamera.js'
export { createCameraController, describeCameraError, DEFAULT_CONSTRAINTS } from './camera-controller.js'
export {
  createGroup4PhotoProvider, createSimulatedProvider, runLivenessCheck, normalizeOutcome,
  isProvider, LIVENESS_STATES, SIMULATED_SCENARIOS,
} from './liveness-providers.js'
