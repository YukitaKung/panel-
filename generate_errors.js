const fs = require('fs');
const path = require('path');

const generateHTML = (code, title, description) => `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${code} - ${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800;900&display=swap');
        
        @font-face {
            font-family: 'LINE Seed Sans TH';
            src: url('https://cdn.jsdelivr.net/gh/line/line-seed@1.0.0/fonts/TH/Woff2/LINESeedSansTH_W_Rg.woff2') format('woff2');
            font-weight: 400;
        }
        @font-face {
            font-family: 'LINE Seed Sans TH';
            src: url('https://cdn.jsdelivr.net/gh/line/line-seed@1.0.0/fonts/TH/Woff2/LINESeedSansTH_W_Bd.woff2') format('woff2');
            font-weight: 700;
        }
        @font-face {
            font-family: 'LINE Seed Sans TH';
            src: url('https://cdn.jsdelivr.net/gh/line/line-seed@1.0.0/fonts/TH/Woff2/LINESeedSansTH_W_XBd.woff2') format('woff2');
            font-weight: 800;
        }
        @font-face {
            font-family: 'LINE Seed Sans TH';
            src: url('https://cdn.jsdelivr.net/gh/line/line-seed@1.0.0/fonts/TH/Woff2/LINESeedSansTH_W_He.woff2') format('woff2');
            font-weight: 900;
        }

        :root {
            --primary: #f97316;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg: #ffffff;
            --border: #f1f5f9;
        }

        body {
            margin: 0;
            font-family: 'LINE Seed Sans TH', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }

        .header {
            width: 100%;
            padding: 1.5rem 2rem;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
        }

        .logo {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: cover;
        }

        .brand-name {
            margin-left: 1rem;
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--text-main);
            letter-spacing: -0.02em;
        }

        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        h1 {
            font-size: 8.5rem;
            font-weight: 900;
            margin: 0;
            color: var(--primary);
            line-height: 1;
            letter-spacing: -0.03em;
        }

        h2 {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 1.5rem 0 1rem 0;
            color: var(--text-main);
            letter-spacing: -0.02em;
        }

        p {
            font-size: 1.25rem;
            color: var(--text-muted);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
            font-weight: 400;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <header class="header">
        <img src="https://i.ibb.co/CsNNVsSL/sssj.png" alt="Logo" class="logo">
    </header>
    <main class="main">
        <h1>${code}</h1>
        <h2>${title}</h2>
        <p>${description}</p>
    </main>
</body>
</html>`;

const errors = [
    { code: '403', title: 'การเข้าถึงถูกปฏิเสธ', description: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้หรือไฟล์นี้บนเซิร์ฟเวอร์ อาจเป็นเพราะการตั้งค่าสิทธิ์การเข้าถึงหรือข้อจำกัดด้านความปลอดภัย' },
    { code: '404', title: 'ไม่พบหน้าเว็บ', description: 'หน้าที่คุณกำลังค้นหาไม่มีอยู่ อาจถูกลบไปแล้ว เปลี่ยนชื่อ หรือพิมพ์ URL ผิด' },
    { code: '500', title: 'ข้อผิดพลาดเซิร์ฟเวอร์', description: 'เกิดข้อผิดพลาดบางอย่างที่ฝั่งเซิร์ฟเวอร์ ทำให้ไม่สามารถแสดงผลหน้านี้ได้ โปรดติดต่อผู้ดูแลระบบ' },
    { code: '502', title: 'เกตเวย์ผิดพลาด', description: 'เซิร์ฟเวอร์ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ต้นทาง หรือแอปพลิเคชันปลายทางอาจจะหยุดทำงานอยู่' },
    { code: '503', title: 'บริการไม่พร้อมใช้งาน', description: 'เซิร์ฟเวอร์กำลังปิดปรับปรุงชั่วคราว หรือทำงานหนักเกินไป โปรดลองใหม่อีกครั้งในภายหลัง' },
    { code: '504', title: 'หมดเวลาการเชื่อมต่อ', description: 'เซิร์ฟเวอร์ใช้เวลาตอบสนองนานเกินไปในการเชื่อมต่อกับเซิร์ฟเวอร์ต้นทาง' },
];

const dir = path.join(__dirname, 'error_pages_temp');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

errors.forEach(err => {
    fs.writeFileSync(path.join(dir, `${err.code}.html`), generateHTML(err.code, err.title, err.description));
});

console.log('Error pages generated in ' + dir);
