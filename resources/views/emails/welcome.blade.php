<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chào mừng bạn đến với Gia Phả Số</title>
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
        .footer a {
            color: #c5a880;
            text-decoration: none;
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
                <h1>Kính chào {{ $hoTen }},</h1>
                <p>Chào mừng bạn đã gia nhập không gian số hóa và gìn giữ cội nguồn của dòng họ. Chúng tôi rất vinh dự được đồng hành cùng bạn trên hành trình thiêng liêng kết nối các thế hệ.</p>
                <p>Tài khoản của bạn đã được khởi tạo thành công trên hệ thống **Gia Phả Số**. Từ bây giờ, bạn có thể tham gia tìm hiểu, cập nhật thông tin thành viên, xem cây gia phả trực quan và nhận thông tin các ngày giỗ chạp quan trọng.</p>
                
                <div class="btn-container">
                    <a href="{{ $loginUrl }}" class="btn">Vào Không Gian Dòng Họ</a>
                </div>
                
                <p>Nếu bạn gặp bất kỳ khó khăn nào trong quá trình sử dụng hệ thống, xin vui lòng phản hồi email này hoặc liên hệ với Ban quản trị dòng họ để được hỗ trợ kịp thời.</p>
                
                <div class="divider"></div>
                <p style="font-size: 13px; color: #8c8375; font-style: italic;">"Cây có gốc mới nở ngành xanh ngọn,<br>Nước có nguồn mới bể rộng sông sâu."</p>
            </div>
            
            <div class="footer">
                <p>Hệ thống Quản lý Gia phả Số hóa &copy; {{ date('Y') }}</p>
                <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp.</p>
            </div>
        </div>
    </div>
</body>
</html>
