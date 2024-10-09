// Validation rules for creating a website
const { check, body } = require("express-validator");
const createWebsiteValidation = [
    // Validate that 'domain_name' is provided and is a string
    check('domain_name').notEmpty().withMessage('Domain name is required.'),
    check('domain_name').isString().withMessage('Domain name must be a string.'),
  ];


  module.exports = {createWebsiteValidation}