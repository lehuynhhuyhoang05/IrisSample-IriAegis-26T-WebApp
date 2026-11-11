/** Vùng giữa của frame tương ứng với object-fit: cover và object-position: center. */
export function getCoverCrop(frameWidth, frameHeight, viewWidth, viewHeight) {
  if (![frameWidth, frameHeight, viewWidth, viewHeight].every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Kích thước camera không hợp lệ')
  }

  const scale = Math.min(frameWidth / viewWidth, frameHeight / viewHeight)
  const width = Math.min(frameWidth, Math.max(1, Math.round(viewWidth * scale)))
  const height = Math.min(frameHeight, Math.max(1, Math.round(viewHeight * scale)))

  return {
    x: (frameWidth - width) / 2,
    y: (frameHeight - height) / 2,
    width,
    height,
  }
}
