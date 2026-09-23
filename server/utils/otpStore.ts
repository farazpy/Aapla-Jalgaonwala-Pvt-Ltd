interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
}

const otpMap = new Map<string, OTPRecord>();

export function generateAndSaveOTP(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  // 6-digit numeric OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Expire in 10 minutes (600,000 ms)
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpMap.set(cleanEmail, { email: cleanEmail, otp, expiresAt });
  return otp;
}

export function verifyOTP(email: string, otp: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpMap.get(cleanEmail);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpMap.delete(cleanEmail);
    return false;
  }
  return record.otp === otp.trim();
}

export function clearOTP(email: string): void {
  const cleanEmail = email.trim().toLowerCase();
  otpMap.delete(cleanEmail);
}
