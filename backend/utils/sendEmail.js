const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isGmail = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail.com');
  
  const transporterConfig = isGmail 
    ? {
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Add timeouts for non-Gmail hosts as well
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
      };

  const transporter = nodemailer.createTransport(transporterConfig);

  const message = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw error; // Rethrow to be caught by the controller
  }
};

module.exports = sendEmail;

