import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // getUserMedia chỉ chạy trên HTTPS (trừ localhost). Plugin này tạo chứng chỉ tự ký
    // để mở được camera khi test bằng iPhone qua mạng LAN.
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Điểm danh khuôn mặt',
        short_name: 'Điểm danh',
        description: 'Điểm danh sinh viên bằng khuôn mặt',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f7fb',
        theme_color: '#f5f7fb',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Bật PWA cả khi chạy `npm run dev` để thử cài đặt/offline.
      devOptions: { enabled: true },
    }),
  ],
  server: { host: true, port: 5173 },
})
