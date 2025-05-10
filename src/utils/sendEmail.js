import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(to, subject, htmlContent) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || '"No Reply"<noreply@crudspi.com>',
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Correo enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    throw new Error("No se pudo enviar el correo");
  }
}

export async function sendWelcomeEmail(email, name) {
  const subject = "🎉 ¡Bienvenido a CRUD-SPI!";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #000033; padding: 20px; border-radius: 8px; color: #fff; text-align: center;">
      <h2 style="color: #ffcc80;">Hola ${name},</h2>
      <p style="font-size: 16px; color: #ffd54f;">¡Bienvenido a <strong>CRUDSPI</strong>!</p>
      <p style="font-size: 15px; color: #f5f5f5;">
        Tu cuenta ha sido creada exitosamente y ahora formas parte de nuestro sistema.
      </p>
      <p style="font-size: 14px; color: #cccccc;">
        Si tienes alguna duda, puedes responder este correo.
      </p>
      <div style="margin-top: 30px; background-color: #007BFF; padding: 10px; border-radius: 5px;">
        <p style="color: white; font-size: 14px; margin: 0;">Gracias por unirte a CRUD-SPI</p>
      </div>
    </div>
  `;

  return sendMail(email, subject, htmlContent);
}
