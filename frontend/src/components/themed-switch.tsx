import { Switch, type SwitchProps } from 'react-native';

import { useTheme } from '@/state/theme';

/**
 * A Switch in the theme's colors: `switchTrackOn` track when on, `switchTrackOff` when
 * off, and a `switchThumb` knob. On the web, react-native-web paints the knob of
 * a switch that's on in its own teal unless it gets `activeThumbColor` (a web-only
 * prop), so that's passed too.
 */
export function ThemedSwitch(props: SwitchProps) {
  const { colors } = useTheme();
  const webKnobColor = { activeThumbColor: colors.switchThumb } as Partial<SwitchProps>;

  return (
    <Switch
      trackColor={{ true: colors.switchTrackOn, false: colors.switchTrackOff }}
      thumbColor={colors.switchThumb}
      {...webKnobColor}
      {...props}
    />
  );
}
