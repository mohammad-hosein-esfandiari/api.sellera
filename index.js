// const app = require('./src/app'); 
// // Importing the Express application instance
// const port = process.env.PORT || 3000; // Setting the port from environment variables or defaulting to 3000

// // Starting the server and listening for incoming requests on the specified port
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`); 
// });



const express = require('express'); // وارد کردن Express
const app = express(); // ساخت برنامه Express
const PORT = 3000; // شماره پورت

// مسیر ریشه
app.get('/', (req, res) => {
  res.send('سلام! به سرور Express خوش آمدید!');
});

// راه‌اندازی سرور
app.listen(PORT, () => {
  console.log(`سرور در حال اجرا روی آدرس http://localhost:${PORT}`);
});
