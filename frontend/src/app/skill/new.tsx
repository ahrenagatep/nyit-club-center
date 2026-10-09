/**
 * New Skill Exchange post (/skill/new?kind=request|offer), or edit one (/skill/new?id=5).
 * After posting, the title, location, and dates are locked; only the
 * description, tags, and extras can be edited.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { KIND_LABEL } from '@/components/skill-cards';
import { SlotPicker, emptySelection } from '@/components/slot-picker';
import { TagPicker, useSkillTagGroups } from '@/components/tag-picker';
import { Brand } from '@/constants/brand';
import { ApiError, SKILL_LIMITS, skillApi, type SkillKind, type SkillPost } from '@/lib/api';
import { buildSlots, formatSlot, slotSelectionError, type SlotSelection } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';

type FieldErrors = Partial<Record<'title' | 'description' | 'extras' | 'location' | 'tags' | 'slots', string>>;

function errorMessage(error: unknown, action: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return `Your session has expired. Sign out and log in again to ${action}.`;
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

function goBackOr(postId?: number) {
  if (router.canGoBack()) router.back();
  else if (postId) router.replace({ pathname: '/skill/[id]', params: { id: String(postId) } });
  else router.replace('/skill-exchange');
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <Text style={[styles.counter, value.length > max && styles.counterOver]} importantForAccessibility="no">
      {value.length}/{max}
    </Text>
  );
}

export default function SkillPostFormScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const editId = params.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const { session } = useAuth();
  const tagGroups = useSkillTagGroups();

  const [kind, setKind] = useState<SkillKind>(params.kind === 'offer' ? 'offer' : 'request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [extras, setExtras] = useState('');
  const [location, setLocation] = useState('');
  const [flexible, setFlexible] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [selection, setSelection] = useState<SlotSelection>(() => emptySelection(kind));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // edit mode: the post being edited (locked fields are shown from it)
  const [original, setOriginal] = useState<SkillPost | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId || !session) return;
    let cancelled = false;
    skillApi
      .get(session.access_token, editId)
      .then(({ post }) => {
        if (cancelled) return;
        if (!post.is_owner) {
          setLoadError('Only the poster can edit this post.');
          return;
        }
        setOriginal(post);
        setKind(post.kind);
        setDescription(post.description);
        setExtras(post.extras ?? '');
        setTags(post.tags);
      })
      .catch((error) => !cancelled && setLoadError(errorMessage(error, 'edit this post')));
    return () => {
      cancelled = true;
    };
  }, [editId, session]);

  const changeKind = (next: SkillKind) => {
    if (next === kind) return;
    setKind(next);
    setSelection(emptySelection(next));
    setErrors((e) => ({ ...e, slots: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!editId) {
      if (!title.trim()) next.title = 'Add a title.';
      else if (title.trim().length > SKILL_LIMITS.title) next.title = `Keep the title to ${SKILL_LIMITS.title} characters.`;
      if (location.trim().length > SKILL_LIMITS.location) next.location = `Keep the location to ${SKILL_LIMITS.location} characters.`;
      const slotError = slotSelectionError(selection, SKILL_LIMITS.slots);
      if (slotError) next.slots = slotError;
    }
    if (!description.trim()) next.description = 'Add a description.';
    else if (description.trim().length > SKILL_LIMITS.description) next.description = `Keep the description to ${SKILL_LIMITS.description} characters.`;
    if (extras.trim().length > SKILL_LIMITS.extras) next.extras = `Keep extras to ${SKILL_LIMITS.extras} characters.`;
    if (!tags.length) next.tags = 'Add at least one tag.';
    return next;
  };

  const submit = async () => {
    if (!session || saving) return;
    const found = validate();
    setErrors(found);
    setFormError(Object.keys(found).length ? 'Fix the highlighted fields first.' : null);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      if (editId) {
        await skillApi.update(session.access_token, editId, {
          description: description.trim(),
          extras: extras.trim() || null,
          tags,
        });
        goBackOr(editId);
      } else {
        const { post } = await skillApi.create(session.access_token, {
          kind,
          title: title.trim(),
          description: description.trim(),
          extras: extras.trim() || null,
          location: location.trim() || null,
          location_flexible: flexible,
          tags,
          slots: buildSlots(selection),
        });
        // the new post takes the form's place, so Back returns to the list
        router.replace({ pathname: '/skill/[id]', params: { id: String(post.post_id) } });
      }
    } catch (error) {
      setFormError(errorMessage(error, editId ? 'save changes' : 'post'));
    } finally {
      setSaving(false);
    }
  };

  const heading = editId ? 'Edit post' : kind === 'offer' ? 'New offer' : 'New request';

  if (editId && (loadError || !original)) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={heading} />
        <View style={styles.center}>
          {loadError ? (
            <Text style={styles.formError} accessibilityRole="alert">
              {loadError}
            </Text>
          ) : (
            <ActivityIndicator size="large" color={Brand.primary} accessibilityLabel="Loading post" />
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={heading}
          subtitle={
            editId
              ? 'Title, location, and dates are locked after posting'
              : kind === 'offer'
                ? 'Offer a skill or service to other students'
                : 'Ask other students for help'
          }
        />

        <View style={styles.form}>
          {!editId && (
            <View style={styles.kindToggle}>
              {(['request', 'offer'] as const).map((k) => {
                const active = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => changeKind(k)}
                    style={[styles.kindButton, active && styles.kindButtonActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={k === 'request' ? 'Post a request' : 'Post an offer'}>
                    <Text style={[styles.kindText, active && styles.kindTextActive]}>{k === 'request' ? 'Request' : 'Offer'}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {original ? (
            <View style={styles.locked} accessible accessibilityLabel={`Locked: ${original.title}`}>
              <Text style={styles.lockedLabel}>🔒 {KIND_LABEL[original.kind]}</Text>
              <Text style={styles.lockedTitle}>{original.title}</Text>
              <Text style={styles.lockedMeta}>
                📍 {original.location || 'No location set'}
                {original.location && original.location_flexible ? ' (flexible)' : ''}
              </Text>
              {(original.slots ?? []).slice(0, 4).map((slot) => (
                <Text key={`${slot.starts_at}-${slot.ends_at}`} style={styles.lockedMeta}>
                  🗓 {formatSlot(slot)}
                </Text>
              ))}
              {(original.slots?.length ?? 0) > 4 && (
                <Text style={styles.lockedMeta}>+ {(original.slots?.length ?? 0) - 4} more dates</Text>
              )}
            </View>
          ) : (
            <>
              <FormField
                label="Title (required)"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setErrors((e) => ({ ...e, title: undefined }));
                }}
                placeholder={kind === 'offer' ? 'e.g. Offering Python lessons' : 'e.g. Requesting a Python lesson'}
                maxLength={SKILL_LIMITS.title}
                error={errors.title}
              />
              <Text style={styles.note}>The title can't be changed after you post.</Text>
            </>
          )}

          <FormField
            label="Description (required)"
            value={description}
            onChangeText={(t) => {
              setDescription(t);
              setErrors((e) => ({ ...e, description: undefined }));
            }}
            placeholder={kind === 'offer' ? 'What can you help with? Your experience?' : 'What do you need help with, and why?'}
            multiline
            textAlignVertical="top"
            style={styles.multiline}
            maxLength={SKILL_LIMITS.description}
            error={errors.description}
          />
          <CharCount value={description} max={SKILL_LIMITS.description} />

          <TagPicker groups={tagGroups} selected={tags} onChange={(t) => {
            setTags(t);
            setErrors((e) => ({ ...e, tags: undefined }));
          }} />
          {errors.tags ? <Text style={styles.fieldError}>{errors.tags}</Text> : null}

          {!original && (
            <>
              <SlotPicker
                kind={kind}
                value={selection}
                onChange={(s) => {
                  setSelection(s);
                  setErrors((e) => ({ ...e, slots: undefined }));
                }}
                error={errors.slots}
              />

              <FormField
                label="Location (optional)"
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Harry J. Schure Hall, or Zoom"
                maxLength={SKILL_LIMITS.location}
                error={errors.location}
              />
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel} nativeID="flexible-label">
                    Flexible location
                  </Text>
                  <Text style={styles.note}>Let others suggest a different place.</Text>
                </View>
                <Switch
                  value={flexible}
                  onValueChange={setFlexible}
                  trackColor={{ true: Brand.primary, false: '#C9CBD1' }}
                  thumbColor={Brand.white}
                  accessibilityLabel="Flexible location"
                  accessibilityLabelledBy="flexible-label"
                />
              </View>
            </>
          )}

          <FormField
            label="Extras (optional)"
            value={extras}
            onChangeText={(t) => {
              setExtras(t);
              setErrors((e) => ({ ...e, extras: undefined }));
            }}
            placeholder={kind === 'offer' ? "e.g. I'm looking for a math tutor in exchange" : 'e.g. I can help you with math in exchange'}
            multiline
            textAlignVertical="top"
            style={styles.multilineSmall}
            maxLength={SKILL_LIMITS.extras}
            error={errors.extras}
          />
          <CharCount value={extras} max={SKILL_LIMITS.extras} />

          <Text style={styles.formError} accessibilityLiveRegion="polite" accessibilityRole={formError ? 'alert' : undefined}>
            {formError ?? ''}
          </Text>

          <Pressable
            onPress={submit}
            disabled={saving}
            style={({ pressed }) => [styles.submit, saving && styles.submitBusy, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
            accessibilityLabel={editId ? 'Save changes' : kind === 'offer' ? 'Post offer' : 'Post request'}>
            <Text style={styles.submitText}>
              {saving ? (editId ? 'Saving…' : 'Posting…') : editId ? 'Save changes' : kind === 'offer' ? 'Post offer' : 'Post request'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => goBackOr(editId ?? undefined)}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  kindToggle: {
    flexDirection: 'row',
    backgroundColor: Brand.chip,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  kindButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindButtonActive: {
    backgroundColor: Brand.primary,
  },
  kindText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textMuted,
  },
  kindTextActive: {
    color: Brand.white,
  },
  locked: {
    backgroundColor: Brand.chip,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  lockedLabel: {
    fontSize: 13,
    color: Brand.textMuted,
    fontWeight: '600',
  },
  lockedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 4,
    marginBottom: 6,
  },
  lockedMeta: {
    fontSize: 14,
    color: Brand.textMuted,
    marginTop: 3,
  },
  note: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: -2,
    marginBottom: 12,
  },
  multiline: {
    flex: 1,
    minHeight: 110,
    paddingVertical: 14,
    fontSize: 16,
    color: Brand.text,
  },
  multilineSmall: {
    flex: 1,
    minHeight: 70,
    paddingVertical: 14,
    fontSize: 16,
    color: Brand.text,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: Brand.textMuted,
    marginTop: -22,
    marginBottom: 10,
  },
  counterOver: {
    color: '#C62828',
  },
  fieldError: {
    color: '#C62828',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  switchText: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  formError: {
    color: '#C62828',
    fontSize: 14,
    minHeight: 20,
    marginTop: 6,
    marginBottom: 8,
    textAlign: 'center',
  },
  submit: {
    backgroundColor: Brand.primary,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBusy: {
    opacity: 0.7,
  },
  submitText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
