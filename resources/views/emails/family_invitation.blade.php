<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Loi moi tham gia dong ho</title>
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
        .info { margin: 22px 0; border: 1px solid #e8e0d2; border-radius: 12px; overflow: hidden; }
        .row { display: flex; border-bottom: 1px solid #eee7dc; }
        .row:last-child { border-bottom: 0; }
        .label { width: 145px; padding: 12px 14px; background: #fcfaf6; color: #806941; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; }
        .value { flex: 1; padding: 12px 14px; color: #2e2a25; font-size: 14px; font-weight: 700; word-break: break-word; }
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
                <h1>Gia Pha So</h1>
                <p>Khong gian dong ho {{ $familyName }}</p>
            </div>
            <div class="content">
                <h2>Kinh chao,</h2>
                <p>{{ $inviterName }} da gui loi moi de ban tham gia dong ho <strong>{{ $familyName }}</strong> va lien ket tai khoan voi ho so <strong>{{ $memberName }}</strong> trong cay gia pha.</p>

                <div class="info">
                    <div class="row">
                        <div class="label">Ho so</div>
                        <div class="value">{{ $memberName }}</div>
                    </div>
                    <div class="row">
                        <div class="label">Dong ho</div>
                        <div class="value">{{ $familyName }}</div>
                    </div>
                    @if($expiresAtText)
                        <div class="row">
                            <div class="label">Han moi</div>
                            <div class="value">{{ $expiresAtText }}</div>
                        </div>
                    @endif
                </div>

                <div class="btn-wrap">
                    <a class="btn" href="{{ $inviteUrl }}">Mo loi moi</a>
                </div>

                <div class="note">
                    Neu nut tren khong hoat dong, vui long sao chep duong dan nay va mo bang trinh duyet: {{ $inviteUrl }}
                </div>
            </div>
            <div class="footer">
                Email nay duoc gui tu he thong Quan ly Gia pha So hoa.
            </div>
        </div>
    </div>
</body>
</html>
