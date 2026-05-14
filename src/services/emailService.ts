import emailjs from '@emailjs/browser';

const SERVICE_ID = (import.meta as any).env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = (import.meta as any).env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = (import.meta as any).env.VITE_EMAILJS_PUBLIC_KEY;

export interface EmailParams {
  to_name: string;
  to_email: string;
  product_name: string;
  download_link: string;
  order_id: string;
}

export const sendDownloadEmail = async (params: EmailParams) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS configuration missing. Please check your environment variables.");
    return { success: false, error: "Configuration missing" };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: params.to_name,
        to_email: params.to_email,
        product_name: params.product_name,
        download_link: params.download_link,
        order_id: params.order_id,
        reply_to: 'support@yourmarket.com', // Optional
      },
      PUBLIC_KEY
    );

    console.log('Email sent successfully:', response.status, response.text);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};
