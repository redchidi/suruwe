import { getMessages } from '../../../i18n';
import Providers from '@/components/Providers';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  const messages = await getMessages(locale);

  return (
    <Providers locale={locale} messages={messages}>
      {children}
    </Providers>
  );
}
