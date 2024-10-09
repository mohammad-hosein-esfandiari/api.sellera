const slugify = require("slugify"); // برای تولید slug
const { Product } = require("../models/Product");

// Function to create a unique slug
async function createUniqueSlug(title) {
    const uniqueCode = `ws-${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique code with prefix ws-
    let slug = slugify(`${uniqueCode}`, { lower: true });
    let uniqueSlug = slug;
    let count = 1;

    // Check for uniqueness
    while (await Product.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${slug}-${count}`; // Add count to make slug unique
        count++;
    }

    return uniqueSlug;
}

module.exports = createUniqueSlug;