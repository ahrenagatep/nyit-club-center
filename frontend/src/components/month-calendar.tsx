/**
 * Month calendar for picking campus days ("YYYY-MM-DD"). Days outside firstKey–lastKey
 * or rejected by isSelectable are greyed out and not focusable.
 * Used by the post form's date picker and the "I can help" time picker.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { WEEK_DAYS, dayKey, monthWeeks, shiftMonth, type CalendarMonth } from '@/lib/calendar';
import { formatDayKey, todayKey } from '@/lib/skill-dates';

function monthOf(key: string): CalendarMonth {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m - 1 };
}

const monthIndex = ({ year, month }: CalendarMonth) => year * 12 + month;

export function MonthCalendar({
  firstKey,
  lastKey,
  initialKey = firstKey,
  isSelectable = () => true,
  selected,
  marked,
  markedLabel = '',
  onPress,
  invalid = false,
}: {
  firstKey: string;
  lastKey: string;
  /** The month shown first. */
  initialKey?: string;
  isSelectable?: (key: string) => boolean;
  selected: Set<string>;
  /** Days drawn lighter (e.g. weekly repeats), announced with markedLabel. */
  marked?: Set<string>;
  markedLabel?: string;
  onPress: (key: string) => void;
  invalid?: boolean;
}) {
  const today = todayKey();
  const [month, setMonth] = useState<CalendarMonth>(() => monthOf(initialKey));
  const atFirst = monthIndex(month) <= monthIndex(monthOf(firstKey));
  const atLast = monthIndex(month) >= monthIndex(monthOf(lastKey));
  const monthName = new Date(month.year, month.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.calendar, invalid && styles.calendarInvalid]}>
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={() => setMonth((m) => shiftMonth(m, -1))}
          disabled={atFirst}
          style={({ pressed }) => [styles.arrowButton, atFirst && styles.disabled, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ disabled: atFirst }}
          accessibilityLabel="Previous month">
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthName} accessibilityRole="header" accessibilityLiveRegion="polite">
          {monthName}
        </Text>
        <Pressable
          onPress={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={atLast}
          style={({ pressed }) => [styles.arrowButton, atLast && styles.disabled, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ disabled: atLast }}
          accessibilityLabel="Next month">
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((weekDay) => (
          <Text key={weekDay} style={styles.weekDay}>
            {weekDay}
          </Text>
        ))}
      </View>

      {monthWeeks(month).map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) return <View key={`empty-${dayIndex}`} style={styles.day} />;
            const key = dayKey(month.year, month.month, day);
            if (key < firstKey || key > lastKey || !isSelectable(key)) {
              return (
                <Text key={key} style={[styles.day, styles.dayText, styles.dayDisabled]} importantForAccessibility="no">
                  {day}
                </Text>
              );
            }
            const isSelected = selected.has(key);
            const isMarked = !isSelected && (marked?.has(key) ?? false);
            return (
              <Pressable
                key={key}
                onPress={() => onPress(key)}
                style={({ pressed }) => [
                  styles.day,
                  styles.dayButton,
                  isMarked && styles.dayMarked,
                  isSelected && styles.daySelected,
                  key === today && !isSelected && styles.dayToday,
                  pressed && styles.pressed,
                ]}
                hitSlop={3}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${formatDayKey(key, true)}${key === today ? ', today' : ''}${isMarked && markedLabel ? `, ${markedLabel}` : ''}`}>
                <Text style={[styles.dayText, isSelected && styles.daySelectedText, isMarked && styles.dayMarkedText]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const DAY_SIZE = 38;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  calendar: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 12,
  },
  calendarInvalid: {
    borderColor: '#C62828',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  arrowButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 28,
    color: Brand.primary,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekDay: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textMuted,
  },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
  },
  dayButton: {
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    textAlign: 'center',
    lineHeight: DAY_SIZE,
    fontSize: 14,
    color: Brand.text,
  },
  dayDisabled: {
    color: '#B5B7BF',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Brand.primary,
  },
  daySelected: {
    backgroundColor: Brand.primary,
  },
  daySelectedText: {
    color: Brand.white,
    fontWeight: '700',
  },
  dayMarked: {
    backgroundColor: Brand.primaryTint,
  },
  dayMarkedText: {
    color: Brand.primary,
    fontWeight: '600',
  },
});
