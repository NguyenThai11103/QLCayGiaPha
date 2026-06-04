<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tài khoản Gia Phả Số</title>
    <style>
        body { margin: 0; padding: 0; background: #f7f6f3; color: #2e2a25; font-family: Arial, sans-serif; }
        .wrapper { width: 100%; padding: 36px 0; background: #f7f6f3; }
        .container { max-width: 620px; margin: 0 auto; background: #fff; border: 1px solid #e8e0d2; border-radius: 16px; overflow: hidden; }
        .header { padding: 32px; background: linear-gradient(135deg, #5c3a1e, #b8902c); color: #fff; text-align: center; }
        .header h1 { margin: 0; font-family: Georgia, serif; font-size: 28px; }
        .header p { margin: 6px 0 0; color: rgba(255,255,255,.78); font-size: 13px; }
        .content { padding: 32px; line-height: 1.7; }
        .content h2 { margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; color: #2e2a25; }
        .content p { font-size: 14px; color: #514b43; }
        .credential { margin: 22px 0; border: 1px solid #e8e0d2; border-radius: 12px; overflow: hidden; }
        .row { display: flex; border-bottom: 1px solid #eee7dc; }
        .row:last-child { border-bottom: 0; }
        .label { width: 145px; padding: 12px 14px; background: #fcfaf6; color: #806941; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; }
        .value { flex: 1; padding: 12px 14px; color: #2e2a25; font-size: 14px; font-weight: 700; word-break: break-all; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; padding: 13px 28px; border-radius: 8px; background: #b8902c; color: #fff !important; text-decoration: none; font-weight: 700; }
        .note { padding: 14px 16px; border-radius: 10px; background: #fff8e8; border: 1px solid #efd8a5; color: #6f5420; font-size: 13px; }
        .footer { padding: 22px 32px; background: #fcfaf6; border-top: 1px solid #e8e0d2; text-align: center; color: #8c8375; font-size: 12px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Gia Phả Số</h1>
                <p>{{ $dongHoName ? 'Không gian dòng họ ' . $dongHoName : 'Không gian kết nối nguồn cội' }}</p>
            </div>
            <div class="content">
                <h2>Kính chào {{ $hoTen }},</h2>
                <p>Ban quản trị dòng họ đã cấp tài khoản để bạn truy cập hệ thống Gia Phả Số, xem cây gia phả, cập nhật hồ sơ cá nhân và theo dõi các sự kiện dòng họ.</p>

                <div class="credential">
                    <div class="row">
                        <div class="label">Email</div>
                        <div class="value">{{ $email }}</div>
                    </div>
                    <div class="row">
                        <div class="label">Mật khẩu tạm</div>
                        <div class="value">{{ $temporaryPassword }}</div>
                    </div>
                </div>

                <div class="btn-wrap">
                    <a class="btn" href="{{ $loginUrl }}">Đăng nhập hệ thống</a>
                </div>

                <div class="note">
                    Sau khi đăng nhập lần đầu, vui lòng cập nhật hồ sơ cá nhân và đổi mật khẩu tại mục Hồ sơ để bảo mật tài khoản.
                </div>
            </div>
            <div class="footer">
                Email này được gửi tự động từ hệ thống Quản lý Gia phả Số hóa.
            </div>
        </div>
    </div>
</body>
</html>
