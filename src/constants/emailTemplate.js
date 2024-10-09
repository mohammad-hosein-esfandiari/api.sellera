const emailHTML = (code)=>{
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          .code-box {
            display: inline-block;
            padding: 10px 20px;
            font-size: 30px;
            font-weight: bold;
            color: #000000;
            background-color: #f0f0f0;
            border: 1px solid #cccccc;
            border-radius: 8px;
            cursor: pointer;
            user-select: none; /* جلوگیری از انتخاب متن */
          }
          .code-box:hover {
            background-color: #e0e0e0;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f2f2f2;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f2f2f2;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h2 style="color: #333333; font-size: 24px;">Verify Your Email</h2>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                      Thank you for registering with us! Please use the verification code below to verify your email address.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="userSelect: none , cursor: pointer" class="code-box" id="verificationCode" onclick="navigator.clipboard.writeText(this.textContent)" >
                      ${code} <!-- کد تایید در اینجا جایگذاری شود -->
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <p style="color: #666666; font-size: 14px;">
                      This code is valid for 1 hour. If you did not request this email, please ignore it.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p style="color: #999999; font-size: 12px;">
                      &copy; 2024 WebShop Company. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `

}
const changeOldEmailHTML = (code )=>{
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Change Request</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
              background-color: #f2f2f2;
          }
          .code-box {
              display: inline-block;
              padding: 10px 20px;
              font-size: 30px;
              font-weight: bold;
              color: #000000;
              background-color: #f0f0f0;
              border: 1px solid #cccccc;
              border-radius: 8px;
              cursor: pointer;
              user-select: none; /* Prevent text selection */
          }
          .code-box:hover {
              background-color: #e0e0e0;
          }
      </style>
  </head>
  <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f2f2f2;">
          <tr>
              <td align="center" style="padding: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
                      <tr>
                          <td align="center" style="padding-bottom: 20px;">
                          <img src="https://propification.com/wp-content/uploads/2024/09/20bd823476a342afd056a2887490fbb2.png" alt="wish-prop" title="wish-prop" width="87" height="75" style="display:block" />
                              <h2 style="color: #333333; font-size: 24px;">Email Change Request</h2>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding-bottom: 20px;">
                              <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                  Dear User,<br>
                                  We have received a request to change the email address associated with your account.
                              </p>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding-bottom: 30px;">
                              <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                  Your verification code is:
                              </p>
                              <div style="text-align: center;">
                                  <div class="code-box" id="verificationCode" onclick="navigator.clipboard.writeText(this.textContent)">
                                      ${code} <!-- Verification code goes here -->
                                  </div>
                              </div>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding-bottom: 30px;">
                              <p style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  This code is valid for 1 hour. If you did not request this change, please ignore this email.
                              </p>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding-top: 20px;">
                              <p style="color: #999999; font-size: 12px;">
                                  &copy; 2024 WebShop Company. All rights reserved.
                              </p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
  
  
  `
}


module.exports = {emailHTML,changeOldEmailHTML}