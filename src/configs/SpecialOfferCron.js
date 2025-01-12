const cron = require('node-cron');
const { Product } = require('../models/Product'); // فرض بر این است که مدل Product را وارد کرده‌اید
const moment = require('moment'); // اطمینان حاصل کنید که moment.js نصب و وارد شده است

const batchSize = 100; // تعداد محصولاتی که در هر بچ پردازش می‌شوند

// تابع برای پردازش یک بچ از محصولات و پیشنهادات ویژه آن‌ها
async function processBatch(products) {
    const updatePromises = products.map(async (product) => {
        let updatesMade = false; // پیگیری اینکه آیا به‌روزرسانی‌هایی برای این محصول انجام شده است

        product.specialOffers.forEach((offer) => {
            const now = moment().startOf('day'); // شروع روز کنونی
            const offerStartDate = moment(offer.offerStartDate).startOf('day'); // تاریخ شروع پیشنهاد
            const offerEndDate = moment(offer.offerEndDate).startOf('day'); // تاریخ پایان پیشنهاد

            // بررسی اینکه آیا پیشنهاد باید فعال شود
            if (offerStartDate.isSame(now) || offerStartDate.isBefore(now)) {
                if (!offer.active) {
                    offer.active = true; // فعال‌سازی پیشنهاد
                    updatesMade = true; // علامت‌گذاری اینکه به‌روزرسانی انجام شده است
                }
            }

            // بررسی اینکه آیا پیشنهاد منقضی شده است
            if (offerEndDate.isBefore(now)) {
                if (offer.active) {
                    offer.active = false; // غیرفعال‌سازی پیشنهاد
                    updatesMade = true; // علامت‌گذاری اینکه به‌روزرسانی انجام شده است
                }
            }
        });

        // ذخیره‌سازی محصول تنها در صورتی که به‌روزرسانی‌هایی انجام شده باشد
        if (updatesMade) {
            return await product.save();
        }
    });
    await Promise.all(updatePromises); // به‌روزرسانی‌ها به‌طور همزمان
}

// زمانبندی کرون‌جاب برای بررسی پیشنهادات ویژه
function startSpecialOfferJob() {
    cron.schedule('0 0 * * *', async () => { // هر روز در ساعت ۰۰:۰۰ اجرا می‌شود
        try {
            console.log('Checking special offers for all products...');
            let offset = 0;

            while (true) {
                // دریافت محصولات در بچ‌ها
                const products = await Product.find().skip(offset).limit(batchSize);

                if (products.length === 0) {
                    console.log('No more products found.');
                    break; // خروج از حلقه در صورت عدم وجود محصولات بیشتر
                }

                console.log(`Processing ${products.length} products from offset ${offset}...`);
                
                // پردازش بچ محصولات
                await processBatch(products);
                
                offset += batchSize; // به‌روزرسانی آفست برای بچ بعدی
            }

        } catch (error) {
            console.error("Error during cron job execution:", error);
        }
    });
}

// صدور تابع
module.exports = startSpecialOfferJob;
