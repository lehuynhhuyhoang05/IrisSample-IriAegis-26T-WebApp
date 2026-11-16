import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createCameraController } from './camera-controller.js'

/**
 * Hook React bọc camera controller.
 *
 * const camera = useCamera()
 * <video ref={camera.videoRef} autoPlay muted playsInline />
 * camera.start() / camera.stop() / await camera.capture()
 *
 * Camera luôn được dừng khi component unmount.
 */
export function useCamera(options) {
  const [controller] = useState(() => createCameraController(options))
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const videoRef = useCallback(node => controller.attach(node), [controller])
  useEffect(() => () => controller.stop(), [controller])
  return {
    ...state,
    videoRef,
    controller,
    start: controller.start,
    stop: controller.stop,
    capture: controller.capture,
    getStream: controller.getStream,
    getVideo: controller.getVideo,
  }
}
