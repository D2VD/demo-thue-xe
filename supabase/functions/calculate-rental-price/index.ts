// supabase/functions/calculate-rental-price/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Sử dụng phiên bản Deno std mới hơn nếu cần
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AppSetting {
  setting_key: string;
  setting_value: string; // Lưu trữ dạng text, parse sau
}

interface Destination {
  distance_km: number;
  toll_fee_one_way?: number;
}

interface CarTypeInfo { // Hoặc CarInfo nếu lấy từ bảng cars
  base_daily_rate: number;
  fuel_consumption_l_per_100km: number;
}

interface RequestPayload {
  destinationId?: string; // Hoặc provinceName nếu bạn dùng tên
  carTypeId?: string;     // Hoặc carId nếu thông số theo từng xe
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  // Thêm các options khác nếu cần, ví dụ: includeDriver, numberOfPassengers
}

// Hàm helper để lấy setting value và parse
function getSettingValue(settings: AppSetting[], key: string, defaultValue: number | string): number | string {
  const setting = settings.find(s => s.setting_key === key);
  if (!setting) return defaultValue;
  const numValue = parseFloat(setting.setting_value);
  return isNaN(numValue) ? setting.setting_value : numValue;
}


serve(async (req: Request) => {
  // Xử lý CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*", // Hoặc domain cụ thể của frontend
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Hoặc SUPABASE_SERVICE_ROLE_KEY nếu cần quyền cao hơn

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key not provided in environment variables.");
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const payload: RequestPayload = await req.json();

    if (!payload.startDate || !payload.endDate) {
        return new Response(JSON.stringify({ error: "Start date and end date are required." }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
    // Validate các input khác nếu cần (destinationId, carTypeId)

    // 1. Fetch giá tham chiếu từ app_settings
    const { data: settingsData, error: settingsError } = await supabase.from("app_settings").select("setting_key, setting_value");
    if (settingsError) throw settingsError;
    if (!settingsData) throw new Error("Could not fetch app settings.");

    const settings = settingsData as AppSetting[];
    const fuelPrice = getSettingValue(settings, "fuel_price_ron95", 20000) as number; // Giá dầu/xăng
    const overnightFee = getSettingValue(settings, "overnight_fee_per_night", 300000) as number; // Giá 1 Đêm
    const driverDailyFee = getSettingValue(settings, "driver_daily_fee", 500000) as number; // Công lái xe/ngày
    const driverFeePercentage = getSettingValue(settings, "driver_fee_percentage_on_car_rent", 0.20) as number; // % phí lái xe trên tiền thuê xe

    // 2. Fetch thông tin điểm đến
    let distanceOneWayKm = 0;
    let tollFeeOneWay = 0;
    if (payload.destinationId) { // Giả sử destinationId là ID của tỉnh thành trong bảng destinations
        const { data: destination, error: destError } = await supabase
            .from("destinations")
            .select("distance_km, toll_fee_one_way")
            .eq("id", payload.destinationId) // Hoặc eq("province_name", payload.provinceName)
            .single();
        if (destError || !destination) throw new Error(destError?.message || "Destination not found or invalid.");
        distanceOneWayKm = (destination as Destination).distance_km;
        tollFeeOneWay = (destination as Destination).toll_fee_one_way || 0;
    } else {
        // Xử lý nếu không có destinationId (ví dụ thuê xe nội thành, km tính riêng)
        // Hoặc yêu cầu destinationId là bắt buộc
        return new Response(JSON.stringify({ error: "Destination ID is required." }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }


    // 3. Fetch thông tin loại xe (hoặc xe cụ thể)
    // Giả sử carTypeId là ID của một record trong bảng car_types hoặc cars
    let carBaseDailyRate = getSettingValue(settings, "default_car_base_daily_rate", 1300000) as number; // Giá xe 16c/ngày mặc định
    let carFuelConsumption = getSettingValue(settings, "default_car_fuel_consumption", 12) as number; // Tiêu thụ NL mặc định

    if (payload.carTypeId) {
        const { data: carTypeData, error: carTypeError } = await supabase
            .from("car_types") // Hoặc "cars" nếu thông số theo từng xe
            .select("base_daily_rate, fuel_consumption_l_per_100km")
            .eq("id", payload.carTypeId)
            .single();
        if (carTypeError || !carTypeData) {
            console.warn(`Car type with ID ${payload.carTypeId} not found, using default rates.`);
        } else {
            carBaseDailyRate = (carTypeData as CarTypeInfo).base_daily_rate;
            carFuelConsumption = (carTypeData as CarTypeInfo).fuel_consumption_l_per_100km;
        }
    }


    // 4. Tính toán số ngày, số đêm
    const date1 = new Date(payload.startDate);
    const date2 = new Date(payload.endDate);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime()) || date2 < date1) {
        return new Response(JSON.stringify({ error: "Invalid date range." }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
    const diffTime = date2.getTime() - date1.getTime(); // getTime() để tránh lỗi timezone
    const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + (diffTime === 0 ? 0 : 1) -1); // +1 nếu khác ngày, trừ khi cùng ngày
    const rentalNights = Math.max(0, rentalDays - 1);

    // 5. Áp dụng công thức tính giá
    const distanceTwoWaysKm = distanceOneWayKm * 2;
    const totalFuelCostForTrip = (distanceTwoWaysKm / 100) * carFuelConsumption * fuelPrice;
    const totalCarRentalBaseCost = carBaseDailyRate * rentalDays;
    const totalDriverDailyFee = driverDailyFee * rentalDays;
    const totalOvernightFee = overnightFee * rentalNights;
    const totalTollFee = tollFeeOneWay * 2; // Giả sử phí cầu đường 2 chiều

    // Tổng giá theo công thức bạn mong muốn (cần review kỹ)
    // Giá xe hơn 1 ngày = (Giá xe/ngày * số ngày) + (Công lái xe/ngày * số ngày) + (Giá 1 đêm * số đêm) + Nhiên liệu (2 chiều) + Phí cầu đường (2 chiều)
    const calculatedTotalPrice = totalCarRentalBaseCost +
                               totalDriverDailyFee +
                               totalOvernightFee +
                               totalFuelCostForTrip +
                               totalTollFee;

    // Phí lái xe chi tiết (theo công thức bạn cung cấp)
    // (Giá xe/ngày * số ngày thuê * 20%) + (Giá 1 đêm * số đêm)
    const calculatedDriverFeeDetail = (totalCarRentalBaseCost * driverFeePercentage) + totalOvernightFee;


    const responseBody = {
      totalPrice: Math.round(calculatedTotalPrice), // Làm tròn
      rentalDays,
      rentalNights,
      breakdown: {
        carRentalBaseCost: Math.round(totalCarRentalBaseCost),
        driverDailyFee: Math.round(totalDriverDailyFee),
        overnightFee: Math.round(totalOvernightFee),
        fuelCost: Math.round(totalFuelCostForTrip),
        tollFee: Math.round(totalTollFee),
        // Có thể thêm các chi phí khác
      },
      detailedDriverFee: Math.round(calculatedDriverFeeDetail), // Phí lái xe tính riêng
      parametersUsed: { // Trả về các tham số đã dùng để debug hoặc hiển thị
        fuelPrice,
        overnightFee,
        driverDailyFee,
        driverFeePercentage,
        distanceOneWayKm,
        tollFeeOneWay,
        carBaseDailyRate,
        carFuelConsumption,
        startDate: payload.startDate,
        endDate: payload.endDate,
      }
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});