# Tổng Quan Ý Tưởng Chính Dự Án QLCayGiaPha

## 1. Dự án này giải quyết bài toán gì?
`QLCayGiaPha` là hệ thống số hóa gia phả, giúp một dòng họ lưu trữ thông tin thành viên, tổ chức sự kiện, và quan trọng nhất là tự động suy luận quan hệ xưng hô theo văn hóa Việt Nam.

Bài toán cốt lõi không chỉ là CRUD dữ liệu, mà là trả lời câu hỏi:
- "Người A có quan hệ gì với người B?"
- "Trong dòng họ này, tôi nên xưng hô với từng người như thế nào?"

## 2. Ý tưởng trung tâm
Ý tưởng chính của dự án là mô hình hóa gia phả thành **đồ thị quan hệ (graph)**:
- Mỗi thành viên là một `node`.
- Quan hệ cha/mẹ/con/vợ-chồng là các `edge`.

Từ đồ thị đó, hệ thống dùng thuật toán tìm đường đi ngắn nhất giữa hai người (BFS), chuẩn hóa đường đi thành các mẫu quan hệ (UP/DOWN/SAME), rồi ánh xạ thành cách gọi tiếng Việt phù hợp (ông, bà, bác, chú, cô, dì, con, cháu...).

## 3. Giá trị khác biệt của dự án
So với ứng dụng cây gia đình thông thường, dự án có 3 điểm khác biệt:
1. Có **relationship engine** để suy luận quan hệ, không chỉ hiển thị cây.
2. Tối ưu cho **văn hóa xưng hô Việt Nam** (giới tính, vai vế, nội/ngoại, lớn/nhỏ).
3. Có hướng mở rộng AI để hỗ trợ gợi ý và tự động hóa nghiệp vụ gia phả.

## 4. Các khối chức năng chính
- Xác thực người dùng: đăng ký, đăng nhập, đăng xuất bằng token (Sanctum).
- Quản lý dòng họ: tạo/sửa/xóa thông tin dòng họ.
- Quản lý thành viên: thông tin cá nhân, liên kết cha/mẹ/vợ-chồng.
- Quản lý sự kiện: các sự kiện theo từng dòng họ.
- Tính xưng hô:
  - Tính quan hệ giữa 2 người.
  - Tính quan hệ của 1 người với toàn bộ thành viên trong dòng họ.

## 5. Tư duy kỹ thuật tổng thể
- **Backend (Laravel API)**: chịu trách nhiệm nghiệp vụ, xác thực, lưu trữ và suy luận quan hệ.
- **Frontend (Vue 3)**: giao diện thao tác quản lý dữ liệu và tra cứu quan hệ.
- **Database**: lưu mô hình dòng họ, thành viên, sự kiện, và cache kết quả quan hệ.
- **AI service (FastAPI, tùy chọn)**: nền tảng mở rộng cho các chức năng thông minh trong tương lai.

## 6. Luồng xử lý chính của tính năng xưng hô
1. Người dùng chọn hai thành viên cần tra cứu.
2. Backend dựng các quan hệ trực tiếp từ dữ liệu gia phả.
3. Thuật toán BFS tìm đường liên hệ giữa hai người.
4. Chuẩn hóa đường đi thành pattern quan hệ.
5. Ánh xạ pattern sang tên xưng hô tiếng Việt.
6. Trả kết quả cho frontend và có thể cache để tăng tốc lần sau.

## 7. Mục tiêu dài hạn
- Bảo tồn dữ liệu gia phả theo dạng số.
- Kết nối các thế hệ trong dòng họ bằng dữ liệu và ngữ cảnh văn hóa.
- Tạo nền tảng để phát triển các tính năng AI như gợi ý quan hệ phức tạp, OCR tài liệu gia phả, trực quan hóa cây gia phả nâng cao.

## 8. Tóm tắt một câu
`QLCayGiaPha` là nền tảng quản lý gia phả kết hợp công nghệ đồ thị và logic suy luận để tự động hóa bài toán xưng hô trong gia đình Việt Nam.
