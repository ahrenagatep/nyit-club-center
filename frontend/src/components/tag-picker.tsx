/**
 * Pick tags from the premade Skill Exchange list (browse by group or search) or
 * type your own. Used by the post form and the Requests/Offers filter.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { SKILL_LIMITS, skillApi, type SkillTagGroup } from '@/lib/api';
import { useAuth } from '@/state/auth';

// the premade list rarely changes, so load it once per app session
let cachedGroups: SkillTagGroup[] | null = null;

/** The premade tag groups; null until loaded (or if loading failed: typed tags still work). */
export function useSkillTagGroups(): SkillTagGroup[] | null {
  const { session } = useAuth();
  const [groups, setGroups] = useState<SkillTagGroup[] | null>(cachedGroups);

  useEffect(() => {
    if (cachedGroups || !session) return;
    let cancelled = false;
    skillApi
      .tags(session.access_token)
      .then(({ groups: loaded }) => {
        cachedGroups = loaded;
        if (!cancelled) setGroups(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session]);

  return groups;
}

// characters the API refuses in a tag (it allows letters, numbers, spaces, and & + # . / ' -)
const BAD_TAG_CHARS = /[^\p{L}\p{N} &+#./'-]/u;

/** Problem with a tag someone typed, or null. Mirrors the API's rules. */
export function customTagError(tag: string): string | null {
  if (tag.length > SKILL_LIMITS.tag) return `Tags can be up to ${SKILL_LIMITS.tag} characters.`;
  if (BAD_TAG_CHARS.test(tag)) return "Tags can only use letters, numbers, spaces, and & + # . / ' -";
  return null;
}

const MAX_SUGGESTIONS = 12;

export function TagPicker({
  groups,
  selected,
  onChange,
  max = SKILL_LIMITS.tags,
  label = 'Tags',
  allowCustom = true,
}: {
  /** null while the premade list loads (typing your own still works). */
  groups: SkillTagGroup[] | null;
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  label?: string;
  allowCustom?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedKeys = useMemo(() => new Set(selected.map((tag) => tag.toLowerCase())), [selected]);
  const allTags = useMemo(() => groups?.flatMap((group) => group.tags) ?? [], [groups]);
  const full = selected.length >= max;

  const cleaned = query.trim().replace(/\s+/g, ' ');
  const suggestions = useMemo(() => {
    const q = cleaned.toLowerCase();
    if (!q) return [];
    return allTags
      .filter((tag) => tag.toLowerCase().includes(q) && !selectedKeys.has(tag.toLowerCase()))
      .sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)))
      .slice(0, MAX_SUGGESTIONS);
  }, [cleaned, allTags, selectedKeys]);
  const exactPremade = allTags.find((tag) => tag.toLowerCase() === cleaned.toLowerCase());

  const add = (tag: string) => {
    if (selectedKeys.has(tag.toLowerCase())) return;
    if (full) {
      setError(`You can pick up to ${max} tags.`);
      return;
    }
    onChange([...selected, tag]);
    setQuery('');
    setError(null);
  };

  const addTyped = () => {
    if (!cleaned) return;
    if (exactPremade) return add(exactPremade);
    if (!allowCustom) return;
    const problem = customTagError(cleaned);
    if (problem) {
      setError(problem);
      return;
    }
    add(cleaned);
  };

  const remove = (tag: string) => {
    onChange(selected.filter((t) => t !== tag));
    setError(null);
  };

  const groupTags = groups?.find((group) => group.name === openGroup)?.tags ?? [];

  return (
    <View>
      <Text style={styles.label}>
        {label} <Text style={styles.count}>({selected.length}/{max})</Text>
      </Text>

      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => remove(tag)}
              style={({ pressed }) => [styles.chip, styles.selectedChip, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove tag ${tag}`}>
              <Text style={styles.selectedChipText}>{tag} ✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setError(null);
          }}
          onSubmitEditing={addTyped}
          placeholder={allowCustom ? 'Search or type a new tag' : 'Search tags'}
          placeholderTextColor={Brand.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit={false}
          maxLength={SKILL_LIMITS.tag + 10}
          accessibilityLabel={allowCustom ? `${label}: search or type a new tag` : `${label}: search`}
        />
        {cleaned && (allowCustom || exactPremade) ? (
          <Pressable
            onPress={addTyped}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Add tag ${exactPremade ?? cleaned}`}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.error} accessibilityLiveRegion="polite">
        {error ?? ''}
      </Text>

      {suggestions.length > 0 ? (
        <View style={styles.chipRow}>
          {suggestions.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => add(tag)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Add tag ${tag}`}>
              <Text style={styles.chipText}>+ {tag}</Text>
            </Pressable>
          ))}
        </View>
      ) : cleaned ? null : groups ? (
        <>
          <Text style={styles.browseLabel}>Browse tags</Text>
          <View style={styles.groupRow}>
            {groups.map((group) => {
              const open = openGroup === group.name;
              return (
                <Pressable
                  key={group.name}
                  onPress={() => setOpenGroup(open ? null : group.name)}
                  style={({ pressed }) => [styles.groupChip, open && styles.groupChipOpen, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${group.name} tags`}>
                  <Text style={[styles.groupChipText, open && styles.groupChipTextOpen]}>{group.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {openGroup && (
            <View style={styles.chipRow}>
              {groupTags.map((tag) => {
                const picked = selectedKeys.has(tag.toLowerCase());
                return (
                  <Pressable
                    key={tag}
                    onPress={() => (picked ? remove(selected.find((t) => t.toLowerCase() === tag.toLowerCase()) ?? tag) : add(tag))}
                    style={({ pressed }) => [styles.chip, picked && styles.selectedChip, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked }}
                    accessibilityLabel={picked ? `Remove tag ${tag}` : `Add tag ${tag}`}>
                    <Text style={picked ? styles.selectedChipText : styles.chipText}>
                      {picked ? `✓ ${tag}` : tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },
  count: {
    fontWeight: '400',
    color: Brand.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    maxWidth: '100%',
    backgroundColor: Brand.chip,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    color: Brand.chipText,
    fontSize: 13,
  },
  selectedChip: {
    backgroundColor: Brand.primary,
  },
  selectedChipText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D8DD',
    borderRadius: 12,
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: Brand.text,
  },
  addButton: {
    minHeight: 44,
    minWidth: 60,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    minHeight: 18,
    marginTop: 4,
    marginBottom: 2,
  },
  browseLabel: {
    fontSize: 13,
    color: Brand.textMuted,
    marginBottom: 6,
  },
  // wraps instead of scrolling sideways: a hidden horizontal scroller can't be scrolled with a mouse on web
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  groupChip: {
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  groupChipOpen: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryTint,
  },
  groupChipText: {
    fontSize: 13,
    color: Brand.text,
  },
  groupChipTextOpen: {
    color: Brand.primary,
    fontWeight: '600',
  },
});
