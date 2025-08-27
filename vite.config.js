import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Hoặc '0.0.0.0' - cho phép lắng nghe trên tất cả các địa chỉ IP
    // port: 5173, // Bạn có thể giữ port mặc định hoặc thay đổi nếu cần
  }
})