import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { Themes } from '@/constants/theme';
import { THEME_KEY } from '@/lib/theme-storage';

// each theme's page color and whether it's dark, e.g. { "nyit": ["#22346E", true], ... }
const pages = Object.fromEntries(
  Object.entries(Themes).map(([name, theme]) => [name, [theme.colors.background, theme.dark]]),
);

/**
 * The web page around the app (web only; phones don't use this file). Same as
 * Expo's default page, plus a small script that paints the saved theme's background
 * before the app's code loads, so the page never flashes the wrong color first. It
 * follows the same rule as state/dark-mode.tsx: a saved theme wins; anything else
 * (nothing saved, "Use device setting") is light or dark from the device's setting.
 */
const themeScript = `(function () {
  try {
    var pages = ${JSON.stringify(pages)};
    var saved = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    var page = pages[saved] || pages[window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'];
    var style = document.documentElement.style;
    style.backgroundColor = page[0];
    style.colorScheme = page[1] ? 'dark' : 'light';
  } catch (e) {}
})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
