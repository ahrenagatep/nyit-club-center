import { LightColors } from '@/constants/theme';

/**
 * @deprecated Use `useTheme()` / `useThemedStyles()` from `@/state/theme` instead.
 * These are fixed light-mode colors and won't follow dark mode. Kept only so code
 * written before the theme (e.g. on other branches) still works.
 */
export const Brand = {
  primary: LightColors.primary,
  primaryTint: LightColors.primaryTint,
  tagBackground: LightColors.tagBackground,
  white: LightColors.surface,
  text: LightColors.text,
  textMuted: LightColors.textMuted,
  border: LightColors.border,
  chip: LightColors.surfaceMuted,
  chipText: LightColors.textChip,
  danger: LightColors.danger,
} as const;
