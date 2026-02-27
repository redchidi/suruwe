import { Profile, Order } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://suruwe.com';

export function generateProfileShareMessage(profile: Profile): string {
  const url = `${APP_URL}/${profile.slug}`;
  return `Hi, here is my measurement profile on Suruwe. You can see my photos, measurements, and style notes all in one place: ${url}`;
}

export function generateOrderMessage(profile: Profile, order: Order): string {
  const url = `${APP_URL}/${profile.slug}`;
  
  let message = `${order.tailor_name}, looking to get something made. ${order.description}.`;
  
  if (order.fit_notes) {
    message += ` A few notes on fit: ${order.fit_notes}.`;
  }
  
  message += `\n\nHere is my full profile with measurements and photos: ${url}`;
  
  return message;
}

export function openWhatsApp(message: string, phone?: string): void {
  const encoded = encodeURIComponent(message);
  const phonePath = phone ? `/${phone}` : '';
  window.open(`https://wa.me${phonePath}?text=${encoded}`, '_blank');
}

export function generateCompletedOrderMessage(
  order: Order,
  tailorPhone: string | null
): string {
  let message = `Check out what ${order.tailor_name}`;
  if (order.tailor_city) message += ` in ${order.tailor_city}`;
  message += ` made for me! ${order.description}.`;
  if (tailorPhone) {
    message += `\n\nYou can reach them at ${tailorPhone} if you want something similar.`;
  }
  return message;
}
