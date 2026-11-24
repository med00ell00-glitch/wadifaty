const express = require('express');
const path = require('path');

const app = express();

// إخفاء هوية Express لتقليل كشف معلومات السيرفر
app.disable('x-powered-by');

// رؤوس أمان أساسية لحماية الموقع والزوار
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// منع أرشفة صفحة الإدارة من طرف محركات البحث
app.use('/admin.html', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// قراءة الملفات الثابتة مباشرة من نفس المجلد
app.use(express.static(__dirname));

// الصفحة الرئيسية //
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// صفحة إدارة المباريات //
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// صفحة تفاصيل المباراة //
app.get('/job-details.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'job-details.html'));
});

// صفحة من نحن //
app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// صفحة اتصل بنا //
app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// صفحة سياسة الخصوصية //
app.get('/privacy-policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
// ملف المباريات JSON //
app.get('/jobs.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'jobs.json'));
});
module.exports = app;
