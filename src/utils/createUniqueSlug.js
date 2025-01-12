const slugify = require("slugify"); // برای تولید slug
const { Product } = require("../models/Product");
const { Order } = require("../models/Order");
const { Discount } = require("../models/Discount");

let modelFlag 

// Function to create a unique slug
async function createUniqueSlug(title,model) {
    // if(model == "product"){
    //     modelFlag = Product
    // }else if(model == "order"){
    //     modelFlag = Order
    // }else if(model == "discount"){
    //     modelFlag = Order
    // }
    const uniqueCode = `${title}-${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique code with prefix ws-
    let slug = slugify(`${uniqueCode}`, { lower: true });
    let uniqueSlug = slug;
    let count = 1;

    // Check for uniqueness
    while (await model.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${slug}-${count}`; // Add count to make slug unique
        count++;
    }

    return uniqueSlug;
}

module.exports = createUniqueSlug;