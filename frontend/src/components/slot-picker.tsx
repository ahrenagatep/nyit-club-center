/**
 * Calendar for a Skill Exchange post's dates (campus time).
 * - Specific dates: tap days on the calendar, set one time for all of them or a
 *   different time for each date, and optionally repeat them weekly.
 * - Requests can instead pick "Need it by": any time from now until that day.
 */
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { MonthCalendar } from '@/components/month-calendar';
import type { ThemeColors } from '@/constants/theme';
import type { SkillKind } from '@/lib/api';
import {
  addDays,
  formatDayKey,
  formatMinutes,
  lastSelectableKey,
  selectedDays,
  todayKey,
  windowForDate,
  type SlotSelection,
  type TimeWindow,
} from '@/lib/skill-dates';
import { useTheme, useThemedStyles } from '@/state/theme';

const STEP = 30; // minutes
const MAX_REPEAT_WEEKS = 15;
const DEFAULT_WINDOW = { start: 12 * 60, end: 17 * 60 };

export function emptySelection(kind: SkillKind): SlotSelection {
  return kind === 'request'
    ? { mode: 'deadline', deadline: null }
    : { mode: 'dates', dates: [], window: null, repeatWeeks: 0, perDay: false, windows: {} };
}

/** "All day" switch, or start/end steppers in 30-minute steps; forDay names the date for screen readers. */
function TimeEditor({
  value,
  onChange,
  forDay,
}: {
  value: TimeWindow | null;
  onChange: (next: TimeWindow | null) => void;
  forDay?: string;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const suffix = forDay ? ` for ${forDay}` : '';
  const labelId = `all-day-label${forDay ? `-${forDay.replace(/\W+/g, '-')}` : ''}`;
  return (
    <>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel} nativeID={labelId}>
          All day
        </Text>
        <Switch
          value={!value}
          onValueChange={(allDay) => onChange(allDay ? null : DEFAULT_WINDOW)}
          trackColor={{ true: colors.primary, false: colors.switchTrackOff }}
          thumbColor={colors.switchThumb}
          accessibilityLabel={`All day${suffix}`}
          accessibilityLabelledBy={labelId}
        />
      </View>
      {value && (
        <View style={styles.timeRow}>
          <Stepper
            label="Start time"
            name={`Start time${suffix}`}
            value={formatMinutes(value.start)}
            canDecrease={value.start > 0}
            canIncrease={value.start + STEP < value.end}
            onDecrease={() => onChange({ ...value, start: value.start - STEP })}
            onIncrease={() => onChange({ ...value, start: value.start + STEP })}
          />
          <Stepper
            label="End time"
            name={`End time${suffix}`}
            value={value.end === 1440 ? 'Midnight' : formatMinutes(value.end)}
            canDecrease={value.end - STEP > value.start}
            canIncrease={value.end < 1440}
            onDecrease={() => onChange({ ...value, end: value.end - STEP })}
            onIncrease={() => onChange({ ...value, end: value.end + STEP })}
          />
        </View>
      )}
    </>
  );
}



// "Start time for Mon, Oct 12" → "start time for Mon, Oct 12" (dates keep their capitals)
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function Stepper({
  label,
  name,
  value,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  label: string;
  /** What screen readers call it, when it needs more than the visible label (e.g. "Start time for Mon, Oct 12"). */
  name?: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={onDecrease}
          disabled={!canDecrease}
          style={({ pressed }) => [styles.stepButton, !canDecrease && styles.disabled, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrease }}
          accessibilityLabel={`Earlier ${lowerFirst(name ?? label)}`}>
          <Text style={styles.stepButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.stepValue} accessibilityLiveRegion="polite" accessibilityLabel={`${name ?? label}: ${value}`}>
          {value}
        </Text>
        <Pressable
          onPress={onIncrease}
          disabled={!canIncrease}
          style={({ pressed }) => [styles.stepButton, !canIncrease && styles.disabled, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrease }}
          accessibilityLabel={`Later ${lowerFirst(name ?? label)}`}>
          <Text style={styles.stepButtonText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SlotPicker({
  kind,
  value,
  onChange,
  error,
}: {
  kind: SkillKind;
  value: SlotSelection;
  onChange: (next: SlotSelection) => void;
  error?: string | null;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const today = todayKey();
  const last = lastSelectableKey();

  const picked = useMemo(() => {
    if (value.mode === 'deadline') return new Set(value.deadline ? [value.deadline] : []);
    return new Set(value.dates);
  }, [value]);
  const repeats = useMemo(() => new Set(selectedDays(value).filter((day) => !picked.has(day))), [value, picked]);

  const toggleDay = (key: string) => {
    if (value.mode === 'deadline') {
      onChange({ ...value, deadline: value.deadline === key ? null : key });
    } else {
      const dates = picked.has(key) ? value.dates.filter((d) => d !== key) : [...value.dates, key].sort();
      // with a time per date, a new date starts with the shared time; a removed one drops its own
      const windows = { ...(value.windows ?? {}) };
      if (picked.has(key)) delete windows[key];
      else windows[key] = value.window;
      onChange({ ...value, dates, windows });
    }
  };

  const setMode = (mode: SlotSelection['mode']) => {
    if (mode === value.mode) return;
    onChange(mode === 'deadline' ? { mode, deadline: null } : { mode, dates: [], window: null, repeatWeeks: 0, perDay: false, windows: {} });
  };

  const dates = value.mode === 'dates' ? value : null;
  const timeWindow = dates?.window ?? null;
  const days = selectedDays(value);

  let summary = '';
  if (value.mode === 'deadline') {
    summary = value.deadline ? `Any time from now until the end of ${formatDayKey(value.deadline)}` : 'Tap the day you need help by.';
  } else if (!days.length) {
    summary = kind === 'offer' ? "Tap the days you're available." : 'Tap the days that work for you.';
  } else {
    const time = dates?.perDay
      ? 'different times'
      : timeWindow
        ? `${formatMinutes(timeWindow.start)} – ${formatMinutes(timeWindow.end)}`
        : 'all day';
    summary = `${days.length} ${days.length === 1 ? 'date' : 'dates'}, ${time}`;
    if (dates && dates.repeatWeeks > 0) {
      summary += `, through ${formatDayKey(days[days.length - 1])}`;
    }
  }

  return (
    <View>
      <Text style={styles.label}>{kind === 'offer' ? 'Available dates' : 'Date / deadline'}</Text>

      {kind === 'request' && (
        <View style={styles.modeToggle}>
          {(
            [
              ['deadline', 'Need it by a date'],
              ['dates', 'Specific dates'],
            ] as const
          ).map(([mode, text]) => {
            const active = value.mode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setMode(mode)}
                style={[styles.modeButton, active && styles.modeButtonActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={text}>
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{text}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <MonthCalendar
        firstKey={today}
        lastKey={last}
        selected={picked}
        marked={repeats}
        markedLabel="repeats weekly"
        onPress={toggleDay}
        invalid={Boolean(error)}
      />

      {dates && (
        <>
          {dates.dates.length > 1 && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel} nativeID="same-time-label">
                Same time on every date
              </Text>
              <Switch
                value={!dates.perDay}
                onValueChange={(same) =>
                  onChange({
                    ...dates,
                    perDay: !same,
                    // start each date from the shared time
                    windows: same ? dates.windows : Object.fromEntries(dates.dates.map((d) => [d, windowForDate(dates, d)])),
                  })
                }
                trackColor={{ true: colors.primary, false: colors.switchTrackOff }}
                thumbColor={colors.switchThumb}
                accessibilityLabel="Same time on every date"
                accessibilityLabelledBy="same-time-label"
              />
            </View>
          )}

          {dates.perDay && dates.dates.length > 1 ? (
            [...dates.dates].sort().map((date) => (
              <View key={date} style={styles.dayCard}>
                <Text style={styles.dayCardTitle} accessibilityRole="header">
                  {formatDayKey(date)}
                </Text>
                <TimeEditor
                  value={windowForDate(dates, date)}
                  forDay={formatDayKey(date)}
                  onChange={(next) => onChange({ ...dates, windows: { ...(dates.windows ?? {}), [date]: next } })}
                />
              </View>
            ))
          ) : (
            <TimeEditor value={timeWindow} onChange={(next) => onChange({ ...dates, window: next })} />
          )}

          <Stepper
            label="Repeat weekly"
            value={
              dates.repeatWeeks === 0
                ? 'Off'
                : `${dates.repeatWeeks} more ${dates.repeatWeeks === 1 ? 'week' : 'weeks'}${
                    dates.dates.length ? ` (until ${formatDayKey(addDays(dates.dates[dates.dates.length - 1], dates.repeatWeeks * 7))})` : ''
                  }`
            }
            canDecrease={dates.repeatWeeks > 0}
            canIncrease={dates.repeatWeeks < MAX_REPEAT_WEEKS}
            onDecrease={() => onChange({ ...dates, repeatWeeks: dates.repeatWeeks - 1 })}
            onIncrease={() => onChange({ ...dates, repeatWeeks: dates.repeatWeeks + 1 })}
          />
        </>
      )}

      <Text style={styles.summary} accessibilityLiveRegion="polite">
        {summary}
      </Text>
      <Text style={styles.error} accessibilityLiveRegion="polite">
        {error ?? ''}
      </Text>
    </View>
  );
}


const createStyles = (colors: ThemeColors) => StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLabel,
    marginBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
  },
  modeText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  modeTextActive: {
    color: colors.textAccent,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.text,
  },
  timeRow: {
    gap: 4,
  },
  dayCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    marginTop: 8,
  },
  dayCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  stepperLabel: {
    fontSize: 15,
    color: colors.text,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 24,
    color: colors.textAccent,
    marginTop: -2,
  },
  stepValue: {
    minWidth: 92,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 6,
    flexShrink: 1,
  },
  summary: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    minHeight: 18,
    marginTop: 4,
  },
});
