<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yêu cầu phê duyệt dòng họ mới</title>
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
        .info-card {
            background-color: #fcfbf9;
            border-left: 4px solid #c5a880;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .info-item {
            margin-bottom: 10px;
            font-size: 14px;
        }
        .info-label {
            font-weight: bold;
            color: #1e1b18;
            display: inline-block;
            width: 150px;
        }
        .info-value {
            color: #514b43;
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
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 class="logo-text">Gia Phả</h1>
                <p class="logo-sub">Nguồn cội số - Quản trị</p>
            </div>
            
            <div class="content">
                <h1>Kính gửi Quản trị viên,</h1>
                <p>Hệ thống nhận được một yêu cầu khởi tạo dòng họ mới từ người dùng đăng ký. Vui lòng xem xét thông tin chi tiết dưới đây:</p>
                
                <div class="info-card">
                    <div class="info-item">
                        <span class="info-label">Tên dòng họ đề xuất:</span>
                        <span class="info-value"><strong>{{ $clanName }}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Địa chỉ từ đường:</span>
                        <span class="info-value">{{ $clanAddress ?: 'Chưa cập nhật' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Người đề xuất:</span>
                        <span class="info-value">{{ $creatorName }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email liên hệ:</span>
                        <span class="info-value">{{ $creatorEmail }}</span>
                    </div>
                </div>
                
                <p>Để phê duyệt dòng họ này đi vào hoạt động và cấp quyền Trưởng tộc (Quản lý) cho người đề xuất, bạn hãy đăng nhập vào trang quản trị hệ thống và thay đổi trạng thái hoạt động của dòng họ.</p>
                
                <div class="btn-container">
                    <a href="{{ url('/admin/login') }}" class="btn">Đến Trang Quản Trị</a>
                </div>
                
                <div class="divider"></div>
                <p style="font-size: 13px; color: #8c8375; font-style: italic;">Hệ thống Quản lý Gia phả Số hóa &copy; {{ date('Y') }}</p>
            </div>
        </div>
    </div>
</body>
</html>
