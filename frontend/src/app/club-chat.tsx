// Club chat: placeholder for now.
// club chats get their own design doc later. this file just needs a screen so the route works (+ tsc stops complaining).
// lesson learned: an empty file in app/ is still a "route" to expo-router, but w/ no `export default` there's no screen.
// -> it warns, + typed routes don't count "/club-chat" as real, which broke router.push in chat.tsx.

import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/state/theme';

export default function ClubChatScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Club Chat" />
      <View style={styles.center}>
        <Text style={styles.icon} importantForAccessibility="no">
          💬
        </Text>
        <Text style={styles.title}>Club chats are coming soon</Text>
        <Text style={styles.text}>For now you can message people one-on-one from Direct Messages.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    icon: {
      fontSize: 42,
      marginBottom: 15,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    text: {
      color: colors.textMutedChat,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
