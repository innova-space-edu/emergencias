import nodemailer from 'nodemailer';

export async function sendInstitutionalMail(args:{to:string;subject:string;text:string;html?:string}) {
  const user=process.env.GMAIL_USER, pass=process.env.GMAIL_PASS;
  if (!user || !pass) throw new Error('Correo no configurado');
  const transporter=nodemailer.createTransport({ service:'gmail', auth:{user,pass} });
  return transporter.sendMail({ from:`Innova Emergencias <${user}>`, to:args.to, subject:args.subject, text:args.text, html:args.html });
}
