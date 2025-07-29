const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - AgriLink',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">AgriLink</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your AgriLink account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="background: #e9e9e9; padding: 15px; border-radius: 5px; word-break: break-all; color: #333;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                <strong>Important:</strong>
              </p>
              <ul style="color: #999; font-size: 14px; line-height: 1.5;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security, this link can only be used once</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2024 AgriLink. All rights reserved.</p>
              <p>Connecting farmers directly to consumers</p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful - AgriLink',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">AgriLink</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Successful</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your password has been successfully reset. You can now log in to your AgriLink account with your new password.
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                ✅ Your password has been updated successfully
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                <strong>Security Tips:</strong>
              </p>
              <ul style="color: #999; font-size: 14px; line-height: 1.5;">
                <li>Use a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Enable two-factor authentication for extra security</li>
                <li>Log out from all devices if you suspect unauthorized access</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2024 AgriLink. All rights reserved.</p>
              <p>Connecting farmers directly to consumers</p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail
}; 