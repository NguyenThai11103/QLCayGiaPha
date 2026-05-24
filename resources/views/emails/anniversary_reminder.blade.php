<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nhắc nhở ngày Giỗ sắp tới</title>
    <style>
        body {
            font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
            background-color: #f7f9fc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #b8902c, #5c3a1e);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
        }
        .header .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 2px;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-family: 'Georgia', serif;
        }
        .header .subtitle {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            opacity: 0.85;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #2d3748;
            line-height: 1.7;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 20px;
        }
        .desc {
            font-size: 15px;
            color: #4a5568;
            margin-bottom: 30px;
        }
        .anniversary-card {
            background: #fcf9f2;
            border: 1px solid #ebdcb8;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
        }
        .card-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #b8902c;
            font-weight: 700;
            margin-bottom: 12px;
        }
        .member-name {
            font-family: 'Georgia', serif;
            font-size: 22px;
            font-weight: 700;
            color: #5c3a1e;
            margin-bottom: 8px;
        }
        .member-info {
            font-size: 14px;
            color: #718096;
            margin-bottom: 16px;
        }
        .divider {
            height: 1px;
            background: #ebdcb8;
            margin: 16px 0;
        }
        .date-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .date-item {
            flex: 1;
        }
        .date-label {
            font-size: 11px;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .date-value {
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
        }
        .date-value.highlight {
            color: #b8902c;
        }
        .action-box {
            text-align: center;
            margin: 35px 0 15px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #b8902c, #8a5a2e);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-weight: 700;
            font-size: 14px;
            border-radius: 30px;
            box-shadow: 0 4px 15px rgba(184, 144, 44, 0.25);
            transition: all 0.2s;
        }
        .footer {
            background-color: #f7f9fc;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
        }
        .footer p {
            margin: 6px 0;
        }
        .quote {
            font-style: italic;
            color: #718096;
            margin-top: 20px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Gia Tộc Việt</div>
            <div class="subtitle">Nguồn Cội Số - Kết Nối Tương Lai</div>
        </div>
        <div class="content">
            <div class="greeting">Kính gửi anh/chị {{ $user_name }},</div>
            <div class="desc">
                Hệ thống Quản lý Cây Gia phả xin gửi thông tin nhắc nhở về ngày Giỗ sắp tới của một thành viên khuất bóng trong chi phái/nhánh của gia đình chúng ta để toàn thể con cháu cùng tưởng nhớ và chuẩn bị:
            </div>
            
            <div class="anniversary-card">
                <div class="card-title">Lễ Giỗ Sắp Tới (Còn 3 ngày)</div>
                <div class="member-name">{{ $deceased_name }}</div>
                <div class="member-info">
                    Thành viên thuộc đời thứ <strong>{{ $deceased_generation }}</strong> • Vai vế dòng họ: <strong>{{ $relationship }}</strong>
                </div>
                
                <div class="divider"></div>
                
                <div class="date-box">
                    <div class="date-item">
                        <div class="date-label">Âm lịch (Ngày Giỗ chính)</div>
                        <div class="date-value highlight">{{ $lunar_date_str }}</div>
                    </div>
                    <div style="width: 20px;"></div>
                    <div class="date-item">
                        <div class="date-label">Dương lịch năm nay</div>
                        <div class="date-value">{{ $solar_date_str }}</div>
                    </div>
                </div>
            </div>
            
            <div class="desc" style="font-style: italic; color: #718096;">
                * Lưu ý: Ngày Giỗ được tính toán chính xác theo lịch Âm Việt Nam (múi giờ GMT+7) và đối chiếu sang ngày Dương lịch năm nay để con cháu thuận tiện sắp xếp công việc tề tựu.
            </div>

            <div class="action-box">
                <a href="{{ $app_url }}/gia-pha/cay-gia-pha" class="btn">Xem Cây Gia Phả dòng họ</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Ban Quản Trị Dòng Họ {{ $dong_ho_name }}</strong></p>
            <p>Email này được gửi tự động từ hệ thống Gia Phả Số.</p>
            <div class="quote">"Cây có gốc mới nở cành xanh lá, nước có nguồn mới bể cả sông sâu."</div>
        </div>
    </div>
</body>
</html>
