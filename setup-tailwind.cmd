@echo off
setlocal ENABLEDELAYEDEXPANSION

:: ==============================
:: CÀI ĐẶT tailwindcss + postcss
:: ==============================
:install_tailwind
echo 🔧 Đang cài đặt tailwindcss, postcss, autoprefixer...
npm install -D tailwindcss postcss autoprefixer
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Cài đặt thất bại. Đang thử lại...
    goto install_tailwind
) ELSE (
    echo ✅ Đã cài đặt tailwindcss, postcss, autoprefixer thành công!
)

:: ==============================
:: TẠO FILE CẤU HÌNH tailwind
:: ==============================
:init_tailwind
echo 🛠️  Đang khởi tạo file cấu hình tailwind.config.js và postcss.config.js...
npx tailwindcss init -p
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Khởi tạo thất bại. Đang thử lại...
    goto init_tailwind
) ELSE (
    echo ✅ File cấu hình đã được tạo thành công!
)

echo ✅✅ HOÀN TẤT CÀI ĐẶT TAILWIND CSS CHO DỰ ÁN!
pause
