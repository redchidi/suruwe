import { Profile, Order } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://suruwe.com';

export function generateProfileShareMessage(profile: Profile, locale = 'en'): string {
  const url = `${APP_URL}/${profile.slug}`;
  if (locale === 'fr') {
    return `Bonjour, voici mon profil de mesures sur Suruwe. Vous pouvez voir mes photos, mes mesures et mes notes de style en un seul endroit : ${url}`;
  }
  return `Hi, here is my measurement profile on Suruwe. You can see my photos, measurements, and style notes all in one place: ${url}`;
}

export function generateOrderMessage(profile: Profile, order: Order, locale = 'en'): string {
  const url = `${APP_URL}/${profile.slug}/order/${order.id}`;
  if (locale === 'fr') {
    if (order.tailor_name) {
      return `Bonjour ${order.tailor_name}, je voudrais faire confectionner quelque chose. Voici mes détails et mesures : ${url}`;
    }
    return `Je voudrais faire confectionner quelque chose. Voici mes détails et mesures : ${url}`;
  }
  if (order.tailor_name) {
    return `Hi ${order.tailor_name}, I'd like to get something made. Here are my details and measurements: ${url}`;
  }
  return `I'd like to get something made. Here are my details and measurements: ${url}`;
}

export function generateOrderShareMessage(profile: Profile, order: Order, locale = 'en'): string {
  const url = `${APP_URL}/${profile.slug}/order/${order.id}`;
  if (locale === 'fr') {
    return `Voici les détails de ma commande et mes mesures sur Suruwe : ${url}`;
  }
  return `Here are my order details and measurements on Suruwe: ${url}`;
}

export function openWhatsApp(message: string, phone?: string): void {
  const encoded = encodeURIComponent(message);
  const phonePath = phone ? `/${phone}` : '';
  window.open(`https://wa.me${phonePath}?text=${encoded}`, '_blank');
}

export function generateCompletedOrderMessage(order: Order, tailorPhone: string | null, locale = 'en'): string {
  if (locale === 'fr') {
    let message = `Regardez ce que ${order.tailor_name}`;
    if (order.tailor_city) message += ` à ${order.tailor_city}`;
    message += ` a réalisé pour moi ! ${order.description}.`;
    if (tailorPhone) {
      message += `\n\nVous pouvez les contacter au ${tailorPhone} si vous souhaitez quelque chose de similaire.`;
    }
    return message;
  }
  let message = `Check out what ${order.tailor_name}`;
  if (order.tailor_city) message += ` in ${order.tailor_city}`;
  message += ` made for me! ${order.description}.`;
  if (tailorPhone) {
    message += `\n\nYou can reach them at ${tailorPhone} if you want something similar.`;
  }
  return message;
}
