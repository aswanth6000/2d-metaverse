
export const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  console.log('--- Sending Mock Email ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (HTML): ${html}`);
  console.log('--------------------------');
  // Pretend it was sent successfully
  return Promise.resolve();
};


export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail(
    email,
    'Verify Your Email Address',
    `Click this link to verify your email: ${verificationLink}`,
    `<p>Please click <a href="${verificationLink}">this link</a> to verify your email address.</p>`
  );
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Reset Your Password',
    `Click this link to reset your password: ${resetLink}`,
    `<p>Please click <a href="${resetLink}">this link</a> to reset your password.</p>`
  );
};
