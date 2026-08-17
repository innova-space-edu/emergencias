import nodemailer from 'nodemailer';

function getTransporter(){
  const user=process.env.GMAIL_USER, pass=process.env.GMAIL_PASS;
  if (!user || !pass) throw new Error('Correo no configurado');
  return {user,transporter:nodemailer.createTransport({service:'gmail',auth:{user,pass}})};
}

export async function verifyInstitutionalMail(){
  const {transporter}=getTransporter();
  await transporter.verify();
  return true;
}

export async function sendInstitutionalMail(args:{to:string;subject:string;text:string;html?:string}) {
  const {user,transporter}=getTransporter();
  return transporter.sendMail({ from:`Innova Emergency <${user}>`, to:args.to, subject:args.subject, text:args.text, html:args.html });
}
