import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { PLUS_BENEFITS_EN, PLUS_BENEFITS_TR } from '../data/plus';

type Props = {
  visible: boolean;
  context?: 'default' | 'post_value';
  uiLanguage?: string;
  reason?: string;
  remainingDailyScenes?: number;
  onClose: () => void;
  onUpgrade: () => void;
};

export default function RoleoPlusPaywall({
  visible,
  context = 'default',
  uiLanguage = 'tr',
  reason,
  remainingDailyScenes,
  onClose,
  onUpgrade,
}: Props) {
  const isEnglish = uiLanguage === 'en';
  const benefits = isEnglish ? PLUS_BENEFITS_EN : PLUS_BENEFITS_TR;
  const title = context === 'post_value'
    ? (isEnglish ? 'Make this scene feel closer to real life.' : 'Bu sahneyi gerçek hayata daha yakın hale getir.')
    : (isEnglish ? 'Unlimited rehearsal for real conversations' : 'Gerçek hayat konuşmalarına sınırsız prova');
  const subtitle = context === 'post_value'
    ? (isEnglish
      ? 'With Plus, rehearse the same moment with new problems, create your own scene, and let Roleo remember where you struggled.'
      : 'Plus ile aynı anı farklı problemlerle tekrar prova edebilir, kendi senaryonu oluşturabilir ve Roleo’nun zorlandığın noktaları hatırlamasını sağlayabilirsin.')
    : (isEnglish
      ? 'Create your own scene, practice with AI characters, and let Roleo remember the moments that challenged you.'
      : 'Kendi sahneni oluştur, AI karakterlerle çalış, zorlandığın anları Roleo hatırlasın.');
  const cta = isEnglish ? 'Unlock unlimited rehearsal' : 'Sınırsız provayı aç';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(232,181,118,0.14)', 'rgba(18,24,34,0.98)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>ROLEO PLUS</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Feather name="x" size={19} color={colors.inkTertiary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

          {reason ? (
            <View style={styles.reasonBox}>
              <Feather name="lock" size={13} color={colors.accentWarm} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {typeof remainingDailyScenes === 'number' && Number.isFinite(remainingDailyScenes) ? (
            <Text style={styles.limitText}>Bugünkü ücretsiz sahne hakkı: {remainingDailyScenes}</Text>
          ) : null}

          <View style={styles.benefitList}>
            {benefits.map(item => (
              <View key={item} style={styles.benefitRow}>
                <Feather name="check" size={13} color={colors.accentWarm} />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onUpgrade} activeOpacity={0.9}>
            <Text style={styles.primaryText}>{cta}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>{isEnglish ? 'Maybe later' : 'Şimdilik devam et'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    margin: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.bgMid,
    overflow: 'hidden',
    padding: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
  },
  title: {
    ...typography.display,
    color: colors.inkPrimary,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.7,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: 'rgba(232,181,118,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    padding: 12,
    marginBottom: 12,
  },
  reasonText: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  limitText: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
    marginBottom: 12,
  },
  benefitList: {
    gap: 9,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  benefitText: {
    flex: 1,
    ...typography.body,
    color: colors.inkSecondary,
    fontSize: 13.5,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.button,
    color: colors.bgDeep,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
  },
  secondaryText: {
    ...typography.bodyMedium,
    color: colors.accentWarmSoft,
    fontSize: 14,
  },
});
