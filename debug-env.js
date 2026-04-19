
console.log('--- Environment Check ---');
console.log('TWILIO_ACCOUNT_SID exists:', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN exists:', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_WHATSAPP_FROM value:', process.env.TWILIO_WHATSAPP_FROM);
console.log('TWILIO_WHATSAPP value:', process.env.TWILIO_WHATSAPP);
console.log('ADMIN_WHATSAPP_NUMBERS value:', process.env.ADMIN_WHATSAPP_NUMBERS);
if (process.env.TWILIO_ACCOUNT_SID) {
  console.log('TWILIO_ACCOUNT_SID starts with AC:', process.env.TWILIO_ACCOUNT_SID.startsWith('AC'));
  console.log('TWILIO_ACCOUNT_SID length:', process.env.TWILIO_ACCOUNT_SID.length);
}
console.log('Keys starting with TWILIO:', Object.keys(process.env).filter(k => k.startsWith('TWILIO')));
console.log('--- End Check ---');
