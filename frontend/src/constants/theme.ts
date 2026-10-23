/**
 * The app's colors, named by the job they do on screen (not by what they look like),
 * so a dark palette can later reuse the same names. Screens read them through
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
  /** See-through circles and squares on the header (back button, profile circle). */
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

  // ---------- Switches ----------
  /** Track of a switch that is off (on uses primary). */
  switchTrackOff: '#C9CBD1',
  /** The round knob on a switch. */
  switchThumb: '#FFFFFF',

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
