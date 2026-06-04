<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yêu cầu khôi phục mật khẩu - Gia Phả Số</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f7f6f3;
            color: #2e2a25;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f7f6f3;
            padding: 40px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(46, 42, 37, 0.05);
            border: 1px solid #e8e6e1;
        }
        .header {
            background: linear-gradient(135deg, #1e1b18, #3a322b);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 3px solid #c5a880;
        }
        .logo-text {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 28px;
            color: #f7f6f3;
            letter-spacing: 1px;
            margin: 0 0 5px 0;
            font-weight: 700;
        }
        .logo-sub {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #c5a880;
            margin: 0;
            font-weight: 600;
        }
        .content {
            padding: 40px 35px;
            line-height: 1.7;
        }
        h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 22px;
            color: #1e1b18;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 600;
        }
        p {
            font-size: 14.5px;
            color: #514b43;
            margin-bottom: 20px;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            background-color: #c5a880;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(197, 168, 128, 0.3);
            transition: all 0.2s ease;
        }
        .warning-box {
            background-color: #fdfaf5;
            border-left: 4px solid #c5a880;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning-box p {
            font-size: 13.5px;
            color: #7c6f5a;
            margin: 0;
        }
        .divider {
            height: 1px;
            background-color: #e8e6e1;
            margin: 30px 0;
        }
        .footer {
            background-color: #fcfbf9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e8e6e1;
        }
        .footer p {
            font-size: 12px;
            color: #8c8375;
            margin: 0 0 10px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 class="logo-text">Gia Phả</h1>
                <p class="logo-sub">Nguồn cội số</p>
            </div>
            
            <div class="content">
                <h1>Chào bạn,</h1>
                <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản Gia Phả Số liên kết với địa chỉ email này. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                <p>Để đặt lại mật khẩu mới cho tài khoản của bạn, vui lòng sử dụng mã xác nhận (OTP) gồm 6 chữ số dưới đây nhập vào ô xác minh trên ứng dụng:</p>
                
                <div class="otp-container" style="text-align: center; margin: 35px 0;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #8c8375; margin-bottom: 12px; font-weight: 600;">Mã xác nhận khôi phục của bạn</div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; color: #1e1b18; background-color: #fdfaf5; border: 2px dashed #c5a880; padding: 15px 35px; display: inline-block; letter-spacing: 6px; border-radius: 12px; box-shadow: 0 4px 15px rgba(197, 168, 128, 0.1);">
                        {{ $otpCode }}
                    </div>
                </div>
                
                <div class="warning-box">
                    <p>**Lưu ý:** Mã xác nhận (OTP) này chỉ có hiệu lực trong vòng 15 phút vì lý do bảo mật. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
                </div>
                
                <div class="divider"></div>
            </div>
            
            <div class="footer">
                <p>Hệ thống Quản lý Gia phả Số hóa &copy; {{ date('Y') }}</p>
                <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp.</p>
            </div>
        </div>
    </div>
</body>
</html>
