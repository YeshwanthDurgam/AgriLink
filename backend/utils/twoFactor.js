const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate a new TOTP secret
const generateSecret = () => {
  return speakeasy.generateSecret({
    name: 'AgriLink Farm-to-Table',
    issuer: 'AgriLink',
    length: 32
  });
};

// Generate QR code for authenticator app
const generateQRCode = async (secret, email) => {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: email,
    issuer: 'AgriLink',
    algorithm: 'sha1',
    period: 30 // 30-second period
  });
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Verify TOTP token
const verifyToken = (secret, token) => {
  // Simple verification with generous time window
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 10, // 10 time steps (300 seconds) for clock skew
    step: 30
  });
};

// Generate backup codes
const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.floor(Math.random() * 900000 + 100000).toString();
    codes.push({
      code: code,
      used: false
    });
  }
  return codes;
};

// Verify backup code
const verifyBackupCode = (backupCodes, code) => {
  const backupCode = backupCodes.find(bc => bc.code === code && !bc.used);
  if (backupCode) {
    backupCode.used = true;
    return true;
  }
  return false;
};

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  verifyBackupCode
}; 