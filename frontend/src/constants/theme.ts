/**
 * The app's colors, named by the job they do on screen (not by what they look like),
 * so the light and dark palettes share the same names. Screens read them through
 * useTheme() / useThemedStyles() in state/theme.tsx instead of typing hex codes.
 *
 * Every job is listed on the color-jobs page with screenshots of where it's used.
 *
 * Some jobs also have near-identical shades (e.g. textMutedProfile). The group chose
 * to keep those exact shades for now, so each one has its own name: the job, then
 * where it's used. To merge one later, point its users at the main job and delete it.
 */

export const LightColors = {
  // ---------- Page and card backgrounds ----------
  /** Behind everything on a screen. */
  background: '#FFFFFF',
  /** The Verify Email page (the only gray page). */
  backgroundMuted: '#F5F7FA',
  /** Cards, popups, the tab bar, white outline buttons, the selected half of header switches. */
  surface: '#FFFFFF',
  /** Gray boxes: category chips, avatar circles, option buttons, locked fields. */
  surfaceMuted: '#F1F1F3',
  /** Explore: the big emoji box on club cards. */
  surfaceMutedEmoji: '#F3F4F6',
  /** More: the "More coming soon" card. */
  surfaceMutedMore: '#F7F8FA',
  /** Skill Exchange search bar. */
  inputBackground: '#F4F4F6',
  /** Login text boxes. */
  inputBackgroundLogin: '#F5F5F6',
  /** Behind the screens themselves, e.g. while one slides over another (the navigation library's gray). */
  navigationBackground: '#F2F2F2',

  // ---------- The blue header ----------
  /** The blue bar at the top of every screen. */
  header: '#0B55B7',
  /** Titles, back arrows and other white things on the header. */
  onHeader: '#FFFFFF',
  /** Smaller text under header titles. */
  onHeaderMuted: '#E6EEFB',
  /** Sign Up and Forgot Password: "Club & Events Hub" under the logo. */
  onHeaderMutedLogo: '#DCE8FF',
  /** Chats: the subtitle under the title. */
  onHeaderMutedChat: '#D9E6FF',
  /** See-through circles on the header (back button, profile circle). */
  headerButton: 'rgba(255,255,255,0.20)',
  /** Login: the logo tile. */
  headerButtonLogin: 'rgba(255,255,255,0.22)',
  /** Track behind the switches on the header (Lists / Calendar, Requests / Offers). */
  headerControl: '#2467BD',
  /** Chats: track behind the Group Chats / Direct Messages switch. */
  headerControlChat: '#2C6DC5',

  // ---------- NYIT blue: actions and highlights ----------
  /** Filled buttons, selected chips, switches when on, spinners, the active tab. */
  primary: '#0B55B7',
  /** Text on primary buttons and selected chips. */
  onPrimary: '#FFFFFF',
  /** Blue text outside buttons: links, dates, tag text, avatar initials. */
  textAccent: '#0B55B7',
  /** Very light blue fills: avatar circles, date badges, notice boxes. */
  primaryTint: '#E7EFFB',
  /** Profile avatar and activity icons, Skill Exchange active filter tags. */
  primaryTintProfile: '#EAF3FF',
  /** The "Requesting" and "Completed" badges. */
  primaryTintBadge: '#E5EFFF',
  /** Events: date badges on event cards. */
  primaryTintDate: '#E9EEF9',
  /** Chats: avatar circles. */
  primaryTintChat: '#E6EEF9',
  /** Pill behind club tags and Profile's role tag. */
  tagBackground: '#DDEEFF',
  /** Barely-blue boxes: unread notifications, "Waiting for… to reply", "Done?". */
  primarySurface: '#F3F7FD',
  /** Skill Exchange: reply comments. */
  primarySurfaceReply: '#F7F9FC',
  /** Outlines of primarySurface boxes. */
  primaryBorder: '#C9DAF3',
  /** Skill Exchange: outline of reply comments. */
  primaryBorderReply: '#DCE5F2',
  /** Events: the ring around a tapped calendar day. */
  primaryBorderStrong: '#8DB4EA',

  // ---------- Text ----------
  /** Main dark text: titles, names, labels, typed text. */
  text: '#171717',
  /** Form labels. */
  textLabel: '#222222',
  /** Text in chips and tags. */
  textChip: '#1C1C1E',
  /** Login: what you type in the text boxes. */
  textInput: '#111111',
  /** Names of unselected tabs in the bottom bar. */
  textTabInactive: '#000000',
  /** Longer paragraphs: descriptions, comments, messages. */
  textSecondary: '#3F4350',
  /** Gray supporting text and small gray icons. */
  textMuted: '#696C7A',
  /** Profile: major, bio and details. */
  textMutedProfile: '#666A78',
  /** Chats: empty message and last-message previews. */
  textMutedChat: '#6B7280',
  /** Chats: times. */
  textMutedChatTime: '#8A8A8A',
  /** Club Announcements: the button's description on a club page, and the empty message and dates on the Announcements screen. */
  textMutedAnnouncements: '#6B7280',
  /** Login: icons inside the text boxes. */
  textMutedIcon: '#7A7E8C',
  /** Hint text inside empty text boxes. */
  placeholder: '#696C7A',
  /** Login and Sign Up/Forgot Password form boxes. */
  placeholderForm: '#6B6E7A',
  /** Days you can't pick in date pickers. */
  textDisabled: '#B5B7BF',

  // ---------- Borders and lines ----------
  /** Thin outlines around cards and buttons, divider lines. */
  border: '#E2E2E5',
  /** Profile: cards and settings rows. */
  borderProfile: '#E0E2E6',
  /** Chats: lines between chats. */
  borderChat: '#E5E7EB',
  /** Club Announcements: outline of the button on a club page and of announcement cards. */
  borderAnnouncements: '#E5E7EB',
  /** More: the line above "View Profile". */
  borderMore: '#E4E5E8',
  /** Login: outlines of the text boxes. */
  borderLogin: '#E0E1E5',
  /** Darker outlines around text boxes. */
  borderStrong: '#D6D8DD',
  /** Profile: outlines of the Edit Profile text boxes. */
  borderStrongProfile: '#D9DBE1',
  /** Explore: outline of the Leave button. */
  borderStrongLeave: '#D5D7DC',
  /** The line along the top of the bottom tab bar (the navigation library's gray). */
  tabBarBorder: '#D8D8D8',

  // ---------- Errors and destructive actions ----------
  /** Error messages, invalid fields, the notification badge. */
  error: '#C62828',
  /** Profile: the "couldn't save" message. */
  errorProfile: '#B42318',
  /** Sign out, Delete, Cancel this agreement. */
  danger: '#B42318',
  /** Text on red buttons and the notification badge. */
  onDanger: '#FFFFFF',
  /** The pale red "Delete this post?" box. */
  dangerBackground: '#FDECEA',

  // ---------- Status badges ----------
  /** Green badge text: OPEN, AVAILABLE, AGREED, Offering. */
  success: '#11633A',
  /** Pale green behind green badges. */
  successBackground: '#DDF8E8',
  /** Login: the "password reset" message box. */
  successBackgroundLogin: '#E6F4EA',
  /** The pale green Contact box on an agreement. */
  successSurface: '#F2FBF6',
  /** Outline of the Contact box. */
  successBorder: '#BFE6CF',
  /** Amber badge text: CLOSED, WAITING FOR A REPLY. */
  warning: '#7A4A00',
  /** Pale amber behind amber badges. */
  warningBackground: '#FFF1D6',
  /** Gray badge text: COMPLETE, UNAVAILABLE, DECLINED, CANCELLED. */
  neutral: '#4A4D57',

  // ---------- Kudos ----------
  /** The number next to ⭐. */
  kudos: '#6B4E00',
  /** Pill behind ⭐ and the number. */
  kudosBackground: '#FFF6D9',
  /** The "asks for Kudos" box. */
  kudosSurface: '#FFF8E1',

  // ---------- On cards and other surfaces ----------
  // The same jobs as above, for things drawn on a card, popup, chip or text box instead of
  // directly on the page. Light and Dark use the same colors either way; themes with a dark
  // page and light cards (NYIT, Cosmo) need different ones. Anything inside <OnSurface>
  // (state/theme.tsx) gets these automatically for the plain names.
  /** Text on a surface (see `text`). */
  textOnSurface: '#171717',
  /** Form labels on a surface (see `textLabel`). */
  textLabelOnSurface: '#222222',
  /** Paragraphs on a surface (see `textSecondary`). */
  textSecondaryOnSurface: '#3F4350',
  /** Gray supporting text on a surface (see `textMuted`). */
  textMutedOnSurface: '#696C7A',
  /** Blue text on a surface (see `textAccent`). */
  textAccentOnSurface: '#0B55B7',
  /** Filled buttons and selected chips on a surface (see `primary`). */
  primaryOnSurface: '#0B55B7',
  /** Text on `primaryOnSurface`. */
  onPrimaryOnSurface: '#FFFFFF',
  /** Outlines and dividers on a surface (see `border`). */
  borderOnSurface: '#E2E2E5',
  /** Darker outlines on a surface (see `borderStrong`). */
  borderStrongOnSurface: '#D6D8DD',
  /** Hint text in a filled text box: search bars, the DM box, Profile's edit popup (see `placeholder`). */
  placeholderOnSurface: '#696C7A',
  /** Login: hint text in the filled text boxes (see `placeholderForm`). */
  placeholderFormOnSurface: '#6B6E7A',
  /** Home and Explore: the ▽ filter button next to the search bar. */
  textFilterIcon: '#000000',

  // ---------- Switches ----------
  /** Track of a switch that is on. */
  switchTrackOn: '#0B55B7',
  /** Track of a switch that is off. */
  switchTrackOff: '#C9CBD1',
  /** The round knob on a switch. */
  switchThumb: '#FFFFFF',
  /** A switch inside a card, popup or box (see the three above). */
  switchTrackOnOnSurface: '#0B55B7',
  switchTrackOffOnSurface: '#C9CBD1',
  switchThumbOnSurface: '#FFFFFF',

  // ---------- Shadows and dimming ----------
  shadow: '#000000',
  /** Dimmed layer behind popups. */
  backdrop: 'rgba(0,0,0,0.35)',

  // ---------- Startup splash (phones only) ----------
  // app.json repeats splashBackground; app.json can't read this file, so keep them in step.
  splashBackground: '#208AEF',
  splashIconTop: '#3C9FFE',
  splashIconBottom: '#0274DF',
} as const;

export type ThemeColorName = keyof typeof LightColors;

/** A full palette. A dark palette must give every job a color. */
export type ThemeColors = Record<ThemeColorName, string>;

/**
 * Dark mode colors, placeholders until the group picks final ones. Each is the exact
 * inverse of its light color (255 minus red, green and blue), except where noted:
 * the NYIT blue and everything drawn on it stay the same, and colored jobs keep
 * their color with the inverse's brightness. Review page with every swatch:
 * https://claude.ai/artifact/BwUZpEzpBBp6kV1cn9Qbwe
 */
export const DarkColors: ThemeColors = {
  // ---------- Page and card backgrounds ----------
  background: '#000000',
  backgroundMuted: '#0A0805',
  surface: '#000000',
  surfaceMuted: '#0E0E0C',
  surfaceMutedEmoji: '#0C0B09',
  surfaceMutedMore: '#080705',
  inputBackground: '#0B0B09',
  inputBackgroundLogin: '#0A0A09',
  navigationBackground: '#0D0D0D',

  // ---------- The blue header ----------
  header: '#0B55B7', // NYIT blue, kept
  onHeader: '#FFFFFF', // on the blue header, kept
  onHeaderMuted: '#E6EEFB', // on the blue header, kept
  onHeaderMutedLogo: '#DCE8FF', // on the blue header, kept
  onHeaderMutedChat: '#D9E6FF', // on the blue header, kept
  headerButton: 'rgba(255,255,255,0.20)', // on the blue header, kept
  headerButtonLogin: 'rgba(255,255,255,0.22)', // on the blue header, kept
  headerControl: '#2467BD', // kept with the header blue
  headerControlChat: '#2C6DC5', // kept with the header blue

  // ---------- NYIT blue: actions and highlights ----------
  // Pale blues: brightness flipped, blue kept (the plain inverse is orange).
  primary: '#0B55B7', // NYIT blue, kept
  onPrimary: '#FFFFFF', // on blue buttons, kept
  textAccent: '#1D78F1', // NYIT blue made lighter so it reads on black
  primaryTint: '#040C18',
  primaryTintProfile: '#000915',
  primaryTintBadge: '#000A1A',
  primaryTintDate: '#060B16',
  primaryTintChat: '#060E19',
  tagBackground: '#001122',
  primarySurface: '#02060C',
  primarySurfaceReply: '#030508',
  primaryBorder: '#0C1D36',
  primaryBorderReply: '#0D1623',
  primaryBorderStrong: '#153C72',

  // ---------- Text ----------
  text: '#E8E8E8',
  textLabel: '#DDDDDD',
  textChip: '#E3E3E1',
  textInput: '#EEEEEE',
  textTabInactive: '#FFFFFF',
  textSecondary: '#C0BCAF',
  textMuted: '#969385',
  textMutedProfile: '#999587',
  textMutedChat: '#948D7F',
  textMutedChatTime: '#757575',
  textMutedAnnouncements: '#948D7F',
  textMutedIcon: '#858173',
  placeholder: '#969385',
  placeholderForm: '#949185',
  textDisabled: '#4A4840',

  // ---------- Borders and lines ----------
  border: '#1D1D1A',
  borderProfile: '#1F1D19',
  borderChat: '#1A1814',
  borderAnnouncements: '#1A1814',
  borderMore: '#1B1A17',
  borderLogin: '#1F1E1A',
  borderStrong: '#292722',
  borderStrongProfile: '#26241E',
  borderStrongLeave: '#2A2823',
  tabBarBorder: '#272727',

  // ---------- Errors and destructive actions ----------
  // Reds, greens, ambers and golds (here and below): brightness flipped, color kept
  // (the plain inverse would make errors cyan and green badges pink).
  error: '#D73939',
  errorProfile: '#E7564B',
  danger: '#E12C1E', // a red that reads as text on black and under white text
  onDanger: '#FFFFFF', // on red buttons, kept
  dangerBackground: '#150402',

  // ---------- Status badges ----------
  success: '#9CEEC5',
  successBackground: '#072212',
  successBackgroundLogin: '#0B190F',
  successSurface: '#040D08',
  successBorder: '#194029',
  warning: '#FFCF85',
  warningBackground: '#291B00',
  neutral: '#B5B2A8',

  // ---------- Kudos ----------
  kudos: '#FFE294',
  kudosBackground: '#261D00',
  kudosSurface: '#1E1700',

  // ---------- On cards and other surfaces ----------
  // Same as the matching page jobs (Dark's cards are as dark as its page).
  textOnSurface: '#E8E8E8',
  textLabelOnSurface: '#DDDDDD',
  textSecondaryOnSurface: '#C0BCAF',
  textMutedOnSurface: '#969385',
  textAccentOnSurface: '#1D78F1',
  primaryOnSurface: '#0B55B7',
  onPrimaryOnSurface: '#FFFFFF',
  borderOnSurface: '#1D1D1A',
  borderStrongOnSurface: '#292722',
  placeholderOnSurface: '#969385',
  placeholderFormOnSurface: '#949185',
  textFilterIcon: '#FFFFFF',

  // ---------- Switches ----------
  switchTrackOn: '#0B55B7', // NYIT blue, kept
  switchTrackOff: '#36342E',
  switchThumb: '#FFFFFF', // kept; a black knob would disappear
  switchTrackOnOnSurface: '#0B55B7',
  switchTrackOffOnSurface: '#36342E',
  switchThumbOnSurface: '#FFFFFF',

  // ---------- Shadows and dimming ----------
  shadow: '#000000', // kept; a white shadow would glow
  backdrop: 'rgba(0,0,0,0.60)', // kept black (the inverse brightens the screen), a bit darker

  // ---------- Startup splash (phones only) ----------
  splashBackground: '#208AEF', // kept; phones show the splash before the setting is known
  splashIconTop: '#3C9FFE', // kept with the splash
  splashIconBottom: '#0274DF', // kept with the splash
};

/**
 * NYIT: the colors of the alternate NYIT logo, measured from it: dark blue #22346E, yellow
 * #F3AA1C and white. The page is dark blue with white text; cards, popups, the tab bar
 * and notice boxes are yellow with dark blue text; small pieces (chips, avatars, badges,
 * filled text boxes) are white so they read on both. Buttons are yellow on the page and
 * dark blue on cards. Status colors (green, amber, red) keep their meaning.
 */
export const NyitColors: ThemeColors = {
  // ---------- Page and card backgrounds ----------
  background: '#22346E',
  backgroundMuted: '#22346E',
  surface: '#F3AA1C',
  surfaceMuted: '#FFFFFF',
  surfaceMutedEmoji: '#FFFFFF',
  surfaceMutedMore: '#F3AA1C',
  inputBackground: '#FFFFFF',
  inputBackgroundLogin: '#FFFFFF',
  navigationBackground: '#22346E',

  // ---------- The blue header ----------
  header: '#18264F',
  onHeader: '#FFFFFF',
  onHeaderMuted: '#D3DAEE',
  onHeaderMutedLogo: '#D3DAEE',
  onHeaderMutedChat: '#D3DAEE',
  headerButton: 'rgba(255,255,255,0.20)',
  headerButtonLogin: 'rgba(255,255,255,0.22)',
  headerControl: '#2E4382',
  headerControlChat: '#2E4382',

  // ---------- NYIT blue: actions and highlights ----------
  primary: '#F3AA1C',
  onPrimary: '#22346E',
  textAccent: '#F3AA1C',
  primaryTint: '#FFFFFF',
  primaryTintProfile: '#FFFFFF',
  primaryTintBadge: '#FFFFFF',
  primaryTintDate: '#FFFFFF',
  primaryTintChat: '#FFFFFF',
  tagBackground: '#FFFFFF',
  primarySurface: '#F3AA1C',
  primarySurfaceReply: '#F6BE4F',
  primaryBorder: '#C98A0F',
  primaryBorderReply: '#D99A1A',
  primaryBorderStrong: '#FFFFFF',

  // ---------- Text ----------
  text: '#FFFFFF',
  textLabel: '#F2F4FA',
  textChip: '#22346E',
  textInput: '#22346E',
  textTabInactive: '#000000',
  textSecondary: '#E4E8F5',
  textMuted: '#C9D1EA',
  textMutedProfile: '#2E3D6B',
  textMutedChat: '#C9D1EA',
  textMutedChatTime: '#AEB9DA',
  textMutedAnnouncements: '#C9D1EA',
  textMutedIcon: '#4C5A88',
  placeholder: '#AEB9DA',
  placeholderForm: '#AEB9DA',
  textDisabled: '#6F7FB0',

  // ---------- Borders and lines ----------
  border: '#3B4E8C',
  borderProfile: '#3B4E8C',
  borderChat: '#3B4E8C',
  borderAnnouncements: '#3B4E8C',
  borderMore: '#C98A0F',
  borderLogin: '#8C9BC9',
  borderStrong: '#8C9BC9',
  borderStrongProfile: '#22346E',
  borderStrongLeave: '#22346E',
  tabBarBorder: '#C98A0F',

  // ---------- Errors and destructive actions ----------
  error: '#FF8F87',
  errorProfile: '#8C1D12',
  danger: '#FF8F87',
  onDanger: '#22346E',
  dangerBackground: '#FFE1DE',

  // ---------- Status badges ----------
  success: '#11633A',
  successBackground: '#DDF8E8',
  successBackgroundLogin: '#E6F4EA',
  successSurface: '#E6F4EA',
  successBorder: '#BFE6CF',
  warning: '#7A4A00',
  warningBackground: '#FFF1D6',
  neutral: '#4A4D57',

  // ---------- Kudos ----------
  kudos: '#6B4E00',
  kudosBackground: '#FFF6D9',
  kudosSurface: '#FFF8E1',

  // ---------- On cards and other surfaces ----------
  textOnSurface: '#22346E',
  textLabelOnSurface: '#22346E',
  textSecondaryOnSurface: '#22346E',
  textMutedOnSurface: '#2E3D6B',
  textAccentOnSurface: '#22346E',
  primaryOnSurface: '#22346E',
  onPrimaryOnSurface: '#FFFFFF',
  borderOnSurface: '#C98A0F',
  borderStrongOnSurface: '#22346E',
  placeholderOnSurface: '#4C5A88',
  placeholderFormOnSurface: '#4C5A88',
  textFilterIcon: '#22346E',

  // ---------- Switches ----------
  switchTrackOn: '#F3AA1C',
  switchTrackOff: '#4C5A88',
  switchThumb: '#FFFFFF',
  switchTrackOnOnSurface: '#22346E',
  switchTrackOffOnSurface: '#A57510',
  switchThumbOnSurface: '#FFFFFF',

  // ---------- Shadows and dimming ----------
  shadow: '#000000',
  backdrop: 'rgba(10,16,40,0.60)',

  // ---------- Startup splash (phones only) ----------
  splashBackground: '#208AEF',
  splashIconTop: '#3C9FFE',
  splashIconBottom: '#0274DF',
};

/**
 * Cosmo: the Windows 11 "Glow" theme, measured from its wallpaper and theme file. Dim
 * violet #350157 page with glow white #FCE7E7 text (the orb's bright rim); light purple
 * #DCC6F5 cards, popups and tab bar with dim violet text; Glow's own accent, deep violet
 * #680081, for buttons and links on cards. Status colors keep their meaning.
 */
export const CosmoColors: ThemeColors = {
  // ---------- Page and card backgrounds ----------
  background: '#350157',
  backgroundMuted: '#350157',
  surface: '#DCC6F5',
  surfaceMuted: '#F6EFFD',
  surfaceMutedEmoji: '#F6EFFD',
  surfaceMutedMore: '#DCC6F5',
  inputBackground: '#F6EFFD',
  inputBackgroundLogin: '#F6EFFD',
  navigationBackground: '#350157',

  // ---------- The blue header ----------
  header: '#22033A',
  onHeader: '#FCE7E7',
  onHeaderMuted: '#E3CDEB',
  onHeaderMutedLogo: '#E3CDEB',
  onHeaderMutedChat: '#E3CDEB',
  headerButton: 'rgba(252,231,231,0.18)',
  headerButtonLogin: 'rgba(252,231,231,0.20)',
  headerControl: '#4A1A73',
  headerControlChat: '#4A1A73',

  // ---------- NYIT blue: actions and highlights ----------
  primary: '#C9A3F0',
  onPrimary: '#350157',
  textAccent: '#D7B8FF',
  primaryTint: '#F6EFFD',
  primaryTintProfile: '#F6EFFD',
  primaryTintBadge: '#F6EFFD',
  primaryTintDate: '#F6EFFD',
  primaryTintChat: '#F6EFFD',
  tagBackground: '#F6EFFD',
  primarySurface: '#DCC6F5',
  primarySurfaceReply: '#E8DAF9',
  primaryBorder: '#B79BD9',
  primaryBorderReply: '#C9B2E6',
  primaryBorderStrong: '#FCE7E7',

  // ---------- Text ----------
  text: '#FCE7E7',
  textLabel: '#FCE7E7',
  textChip: '#350157',
  textInput: '#350157',
  textTabInactive: '#000000',
  textSecondary: '#EBDDF5',
  textMuted: '#CDB8E6',
  textMutedProfile: '#5B3F7A',
  textMutedChat: '#CDB8E6',
  textMutedChatTime: '#B79BD9',
  textMutedAnnouncements: '#CDB8E6',
  textMutedIcon: '#5E4A7A',
  placeholder: '#B79BD9',
  placeholderForm: '#B79BD9',
  textDisabled: '#7A5A9E',

  // ---------- Borders and lines ----------
  border: '#55307A',
  borderProfile: '#55307A',
  borderChat: '#55307A',
  borderAnnouncements: '#55307A',
  borderMore: '#B79BD9',
  borderLogin: '#B79BD9',
  borderStrong: '#B79BD9',
  borderStrongProfile: '#680081',
  borderStrongLeave: '#680081',
  tabBarBorder: '#B79BD9',

  // ---------- Errors and destructive actions ----------
  error: '#FF9AB0',
  errorProfile: '#8E1A3C',
  danger: '#FF9AB0',
  onDanger: '#350157',
  dangerBackground: '#FFE0E7',

  // ---------- Status badges ----------
  success: '#11633A',
  successBackground: '#DDF8E8',
  successBackgroundLogin: '#E6F4EA',
  successSurface: '#E6F4EA',
  successBorder: '#BFE6CF',
  warning: '#7A4A00',
  warningBackground: '#FFF1D6',
  neutral: '#4A4D57',

  // ---------- Kudos ----------
  kudos: '#6B4E00',
  kudosBackground: '#FFF6D9',
  kudosSurface: '#FFF8E1',

  // ---------- On cards and other surfaces ----------
  textOnSurface: '#350157',
  textLabelOnSurface: '#350157',
  textSecondaryOnSurface: '#4A2A6E',
  textMutedOnSurface: '#5B3F7A',
  textAccentOnSurface: '#680081',
  primaryOnSurface: '#680081',
  onPrimaryOnSurface: '#FFFFFF',
  borderOnSurface: '#B79BD9',
  borderStrongOnSurface: '#680081',
  placeholderOnSurface: '#5E4A7A',
  placeholderFormOnSurface: '#5E4A7A',
  textFilterIcon: '#350157',

  // ---------- Switches ----------
  switchTrackOn: '#C9A3F0',
  switchTrackOff: '#6A4A8E',
  switchThumb: '#FCE7E7',
  switchTrackOnOnSurface: '#680081',
  switchTrackOffOnSurface: '#A98CCB',
  switchThumbOnSurface: '#FFFFFF',

  // ---------- Shadows and dimming ----------
  shadow: '#000000',
  backdrop: 'rgba(12,1,30,0.60)',

  // ---------- Startup splash (phones only) ----------
  splashBackground: '#208AEF',
  splashIconTop: '#3C9FFE',
  splashIconBottom: '#0274DF',
};

/** The themes in Settings → Theme ("Use device setting" picks light or dark). */
export type ThemeName = 'light' | 'dark' | 'nyit' | 'cosmo';

/** Every theme's colors, and whether its page is dark (for the navigation library, the browser, etc.). */
export const Themes: Record<ThemeName, { colors: ThemeColors; dark: boolean }> = {
  light: { colors: LightColors, dark: false },
  dark: { colors: DarkColors, dark: true },
  nyit: { colors: NyitColors, dark: true },
  cosmo: { colors: CosmoColors, dark: true },
};
