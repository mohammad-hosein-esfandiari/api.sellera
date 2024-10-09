const crypto = require('crypto'); // Importing the crypto module for generating verification codes
const nodemailer = require('nodemailer'); // Importing the nodemailer module for sending emails
const VerificationCode = require('../models/VerificationCode'); // Importing the VerificationCode model
const { emailHTML, changeOldEmailHTML } = require('../constants/emailTemplate'); // Importing email templates

// Configuring nodemailer with Gmail service
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // Email user from environment variables
    pass: process.env.EMAIL_PASS, // Email password from environment variables
  },
});

// Function to send verification email
const sendVerificationEmail = async (email, type) => {
  try {
    // Check if a verification code has been sent in the last minute
    const existingCodeEntry = await VerificationCode.findOne({ email ,type });
    const now = Date.now();
    
    // If a code exists and is still valid, throw an error
    if (existingCodeEntry && now < new Date(existingCodeEntry.expiresAt).getTime()) {
      const timesLeft = Math.ceil((new Date(existingCodeEntry.expiresAt).getTime() - now) / 1000); // Calculate remaining time in seconds
      throw new Error('You can only request a verification code once every 1 minutes. Time left: ' + timesLeft + ' seconds.');
    }

    // Generate a verification code
    const code = crypto.randomBytes(3).toString('hex'); // Generate a 3-byte hex code
    const expiresAt = new Date(now + 60000); // Code is valid for 60 seconds



    // Function to choose the appropriate email HTML template based on type
    const emailHTmlTypes = () => {
      switch (type) {
        case "new-user": return changeOldEmailHTML(code); 
        case 'old-email-change': return changeOldEmailHTML(code); 
        case 'new-email-change': return emailHTML(code);
        case 'user-delete-account': return emailHTML(code); 
        case 'delete-website': return emailHTML(code); 
        case 'website-transfer': return emailHTML(code); 
        case 'add-support': return emailHTML(code); 
        default: return emailHTML(code); // Default template
      }
    };

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Recipient email
      subject: 'Verification Code', // Email subject
      html: emailHTmlTypes(), // HTML content of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
        // Save the verification code in the database
        await VerificationCode.findOneAndUpdate(
          { email },
          { code, expiresAt ,type},
          { upsert: true } // Create a new entry if it doesn't exist
        );
    return { success: true, message: 'Verification code sent successfully.' }; // Return success response
  } catch (error) {

    // Return error response for the controller
    return { success: false, message: error.message || 'Error sending email.' };
  }
};

module.exports = { sendVerificationEmail }; // Exporting the sendVerificationEmail function
