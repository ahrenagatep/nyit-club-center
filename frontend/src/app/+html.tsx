import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { DarkColors, LightColors } from '@/constants/theme';
import { THEME_KEY } from '@/lib/theme-storage';

/**
 * The web page around the app (web only; phones don't use this file). Same as
 * Expo's default page, plus a small script that paints the saved light/dark
 * background before the app's code loads, so someone using dark mode never sees
 * a white page first. It follows the same rule as state/dark-mode.tsx: 'dark',
 * 'light', or anything else follows the device's setting.
 */
const themeScript = `(function () {
  try {
    var saved = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var style = document.documentElement.style;
    style.backgroundColor = dark ? ${JSON.stringify(DarkColors.background)} : ${JSON.stringify(LightColors.background)};
    style.colorScheme = dark ? 'dark' : 'light';
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
