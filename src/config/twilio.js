import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default client;
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
