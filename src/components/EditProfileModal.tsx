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
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
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
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Kapat">
              <Feather name="arrow-left" size={20} color={colors.inkSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili düzenle</Text>
            <TouchableOpacity hitSlop={12} accessibilityLabel="Menü">
              <Feather name="more-vertical" size={20} color={colors.inkSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.avatarBlock}>
              <View style={styles.avatar}>
                <Feather name="user" size={40} color={colors.inkTertiary} />
              </View>
              <TouchableOpacity style={styles.camBadge} activeOpacity={0.88}>
                <Feather name="camera" size={14} color={colors.bgDeep} />
              </TouchableOpacity>
            </View>

            <LinguaField label="İSİM" value={name} onChangeText={setName} placeholder="Adınız soyadınız" autoCapitalize="words" />
            <LinguaField label="E-POSTA" value={email} onChangeText={setEmail} placeholder="E-postanızı girin" keyboardType="email-address" />
            <LinguaField label="ŞİFRE" value={password} onChangeText={setPassword} placeholder="Yeni şifre (isteğe bağlı)" secureTextEntry />

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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.bgMid,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 17,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
  },
  avatarBlock: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  camBadge: {
    position: 'absolute',
    right: '50%',
    bottom: 0,
    marginRight: -56,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgMid,
  },
  hint: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkTertiary,
    marginBottom: 20,
    lineHeight: 17,
  },
});
