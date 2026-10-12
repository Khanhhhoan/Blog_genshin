const fs = require('fs');
const path = require('path');

const mdContent = `# 📜 CHÍNH SÁCH TRẢ GÓP ACC – KỲ HẠN 14 NGÀY

### 💰 1. Thanh toán ban đầu
- Khách hàng thanh toán trước **50% tổng giá trị ACC** để bắt đầu giao dịch.
- Sau khi thanh toán đủ 50%, khách được đăng nhập và sử dụng ACC theo thỏa thuận.

### ⏰ 2. Thời hạn trả góp
- Thời gian hoàn tất thanh toán: **14 ngày** kể từ ngày bắt đầu giao dịch.
- Trong thời hạn này, khách có trách nhiệm thanh toán đầy đủ **50% số tiền còn lại**.

### ⚠️ 3. Chính sách thanh toán trễ
- Khách được phép thanh toán trễ **tối đa 02 ngày** so với hạn quy định.
- Nếu thanh toán trễ, khách sẽ chịu phí trễ hạn bằng **10% tổng giá trị ACC**.
- Nếu quá 02 ngày kể từ hạn thanh toán mà khách không thanh toán hoặc không phản hồi, Shop có quyền **thu hồi lại ACC**.

### 🚫 4. Không hủy giao dịch
- Sau khi đã thanh toán khoản trả trước và nhận ACC, khách **không được tự ý hủy kèo**.
- Nếu khách chủ động hủy giao dịch hoặc không tiếp tục thanh toán, **số tiền đã thanh toán sẽ không được hoàn lại**, trừ trường hợp có thỏa thuận khác hoặc lỗi thuộc trách nhiệm bên bán.

### 🔄 5. Không đổi ACC trong thời gian trả góp
- Trong thời gian ACC chưa được thanh toán đủ 100%, khách **không được đổi sang ACC khác**.
- Trường hợp ACC phát sinh lỗi thuộc trách nhiệm bên bán sẽ được xử lý theo chính sách bảo hành riêng.

### ✅ 6. Hoàn tất giao dịch
- Sau khi khách thanh toán đủ 100% giá trị ACC và phí phát sinh nếu có, giao dịch trả góp được xác nhận **hoàn tất**.

---

### 📌 TÓM TẮT QUY TRÌNH
> **Trả trước 50%** ➔ **Nhận ACC** ➔ **Thanh toán phần còn lại trong 14 ngày**  
> - **Trễ hạn**: Tối đa 2 ngày, phí trễ = 10% tổng giá trị ACC.  
> - **Quá 2 ngày** không thanh toán / không phản hồi: **Thu hồi ACC**.  
> - **Quy định**: Trong thời gian trả góp **không hủy kèo – không đổi ACC – khách tự hủy không hoàn tiền**.`;

const htmlContent = `<h1>📜 CHÍNH SÁCH TRẢ GÓP ACC – KỲ HẠN 14 NGÀY</h1>
<h2>💰 1. Thanh toán ban đầu</h2>
<ul>
<li>Khách hàng thanh toán trước <strong>50% tổng giá trị ACC</strong> để bắt đầu giao dịch.</li>
<li>Sau khi thanh toán đủ 50%, khách được đăng nhập và sử dụng ACC theo thỏa thuận.</li>
</ul>
<h2>⏰ 2. Thời hạn trả góp</h2>
<ul>
<li>Thời gian hoàn tất thanh toán: <strong>14 ngày</strong> kể từ ngày bắt đầu giao dịch.</li>
<li>Trong thời hạn này, khách có trách nhiệm thanh toán đầy đủ <strong>50% số tiền còn lại</strong>.</li>
</ul>
<h2>⚠️ 3. Chính sách thanh toán trễ</h2>
<ul>
<li>Khách được phép thanh toán trễ <strong>tối đa 02 ngày</strong> so với hạn quy định.</li>
<li>Nếu thanh toán trễ, khách sẽ chịu phí trễ hạn bằng <strong>10% tổng giá trị ACC</strong>.</li>
<li>Nếu quá 02 ngày kể từ hạn thanh toán mà khách không thanh toán hoặc không phản hồi, Shop có quyền <strong>thu hồi lại ACC</strong>.</li>
</ul>
<h2>🚫 4. Không hủy giao dịch</h2>
<ul>
<li>Sau khi đã thanh toán khoản trả trước và nhận ACC, khách <strong>không được tự ý hủy kèo</strong>.</li>
<li>Nếu khách chủ động hủy giao dịch hoặc không tiếp tục thanh toán, <strong>số tiền đã thanh toán sẽ không được hoàn lại</strong>, trừ trường hợp có thỏa thuận khác hoặc lỗi thuộc trách nhiệm bên bán.</li>
</ul>
<h2>🔄 5. Không đổi ACC trong thời gian trả góp</h2>
<ul>
<li>Trong thời gian ACC chưa được thanh toán đủ 100%, khách <strong>không được đổi sang ACC khác</strong>.</li>
<li>Trường hợp ACC phát sinh lỗi thuộc trách nhiệm bên bán sẽ được xử lý theo chính sách bảo hành riêng.</li>
</ul>
<h2>✅ 6. Hoàn tất giao dịch</h2>
<ul>
<li>Sau khi khách thanh toán đủ 100% giá trị ACC và phí phát sinh nếu có, giao dịch trả góp được xác nhận <strong>hoàn tất</strong>.</li>
</ul>
<hr>
<blockquote>
<strong>📌 TÓM TẮT QUY TRÌNH</strong><br>
<strong>Trả trước 50%</strong> ➔ <strong>Nhận ACC</strong> ➔ <strong>Thanh toán phần còn lại trong 14 ngày</strong><br>
• <strong>Trễ hạn</strong>: Tối đa 2 ngày, phí trễ = 10% tổng giá trị ACC.<br>
• <strong>Quá 2 ngày</strong> không thanh toán / không phản hồi: <strong>Thu hồi ACC</strong>.<br>
• <strong>Quy định</strong>: Trong thời gian trả góp <strong>không hủy kèo – không đổi ACC – khách tự hủy không hoàn tiền</strong>.
</blockquote>`;

// 1. Update blogs_data.json
const jsonPath = path.join(__dirname, 'blogs_data.json');
let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const target = blogs.find(b => b.slug === 'chinhsachtragop');
if (target) {
    target.title = 'Chính sách trả góp acc';
    target.summary = 'Chính sách trả góp ACC kỳ hạn 14 ngày, trả trước 50% nhận acc ngay';
    target.contentMarkdown = mdContent;
    target.contentHtml = htmlContent;
    fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');
    console.log('Updated blogs_data.json');
}

// 2. Regenerate blogs_data.js
require('./generate_js_data.js');

// 3. Update blogs_summary.md
const summaryPath = path.join(__dirname, 'blogs_summary.md');
if (fs.existsSync(summaryPath)) {
    let summary = fs.readFileSync(summaryPath, 'utf8');
    summary = summary.replace(/(## \d+\.\s*Chính sách trả góp[\s\S]*?### Nội dung chi tiết:\n\n)[\s\S]*?(?=---\n\n##|\Z)/, `$1${mdContent}\n\n`);
    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log('Updated blogs_summary.md');
}

console.log('All installment policy files updated successfully.');
