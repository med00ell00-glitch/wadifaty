const express = require('express');
const path = require('path');

const app = express();

// قراءة الملفات الثابتة مباشرة من نفس المجلد
app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// صفحة تفاصيل المباراة
app.get('/job-details.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-details.html'));
});

// صفحة من نحن
app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

// صفحة اتصل بنا
app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});
// صفحة سياسة الخصوصية
app.get('/privacy-policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
module.exports = app;
