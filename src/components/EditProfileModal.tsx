import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { F } from '../theme/fonts';
import LinguaField from './ui/LinguaField';
import LinguaPrimaryButton from './ui/LinguaPrimaryButton';
import type { UserProfile } from '../types';

type Props = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (next: Pick<UserProfile, 'displayName' | 'email'>) => void;
};

export default function EditProfileModal({ visible, profile, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible || !profile) return;
    setName(profile.displayName?.trim() || '');
    setEmail(profile.email?.trim() || '');
    setPassword('');
  }, [visible, profile]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Kapat">
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili düzenle</Text>
            <TouchableOpacity hitSlop={12} accessibilityLabel="Menü">
              <MaterialIcons name="more-vert" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.avatarBlock}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <MaterialIcons name="person" size={48} color={colors.textMuted} />
                </View>
                <TouchableOpacity style={styles.camBadge} activeOpacity={0.88}>
                  <MaterialIcons name="photo-camera" size={16} color={colors.textOnAccent} />
                </TouchableOpacity>
              </View>
            </View>

            <LinguaField label="İsim" value={name} onChangeText={setName} placeholder="Adınız soyadınız" autoCapitalize="words" />
            <LinguaField label="E-posta" value={email} onChangeText={setEmail} placeholder="E-postanızı girin" keyboardType="email-address" />
            <LinguaField label="Şifre" value={password} onChangeText={setPassword} placeholder="Yeni şifre (isteğe bağlı)" secureTextEntry />

            <Text style={styles.hint}>Şifre yalnızca bu oturumda tutulur; Roleo sunucuya gönderilmez.</Text>
          </ScrollView>

          <LinguaPrimaryButton
            label="Kaydet"
            onPress={() => {
              onSave({ displayName: name.trim(), email: email.trim() });
              onClose();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27, 28, 28, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  avatarBlock: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  camBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  hint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 17,
  },
});
