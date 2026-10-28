import { renderToString } from 'react-dom/server';
import { App } from './App';
import { LOCALES, STRINGS, type Locale } from './i18n';

export { LOCALES, STRINGS };

export function render(locale: Locale): string {
  return renderToString(<App locale={locale} />);
}
