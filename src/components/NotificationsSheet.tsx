import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Row = { id: string; icon: React.ComponentProps<typeof Feather>['name']; title: string; body: string; time: string; unread?: boolean };

const TODAY: Row[] = [
  {
    id: '1',
    icon: 'book-open',
    title: 'Yeni ders hazır',
    body: 'Başlangıç paketinde bir sonraki sahne açıldı.',
    time: '5 dk önce',
    unread: true,
  },
  {
    id: '2',
    icon: 'award',
    title: 'Başarı açıldı',
    body: 'Üst üste 5 gün tamamladın, böyle devam!',
    time: '1 sa önce',
    unread: true,
  },
];

const YESTERDAY: Row[] = [
  {
    id: '3',
    icon: 'user',
    title: 'Yeni içerik',
    body: 'Telaffuz ipuçları güncellendi.',
    time: 'Dün',
    unread: false,
  },
  {
    id: '4',
    icon: 'gift',
    title: 'Özel teklif',
    body: 'Bu hafta premium denemesi için davet.',
    time: 'Dün',
    unread: false,
  },
];

function RowItem({ row }: { row: Row }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Feather name={row.icon} size={16} color={colors.accentWarmSoft} />
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowBody}>{row.body}</Text>
        <Text style={styles.rowTime}>{row.time}</Text>
      </View>
      {row.unread ? <View style={styles.dot} /> : null}
    </View>
  );
}

export default function NotificationsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.card, { marginTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="arrow-left" size={20} color={colors.inkSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Bildirimler</Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.markAll}>Tümünü oku</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>BUGÜN</Text>
          {TODAY.map(r => (
            <RowItem key={r.id} row={r} />
          ))}
          <View style={styles.divider} />
          <Text style={styles.section}>DÜN</Text>
          {YESTERDAY.map(r => (
            <RowItem key={r.id} row={r} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  card: {
    marginHorizontal: 12,
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    maxHeight: '78%',
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  title: { fontFamily: 'Fraunces_300Light', fontSize: 17, color: colors.inkPrimary, letterSpacing: -0.2 },
  markAll: { fontFamily: 'InterTight_500Medium', fontSize: 13, color: colors.accentWarm },
  scroll: { paddingHorizontal: 14 },
  section: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.inkTertiary,
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  rowMid: { flex: 1, paddingRight: 8 },
  rowTitle: { fontFamily: 'InterTight_500Medium', fontSize: 14, color: colors.inkPrimary },
  rowBody: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, marginTop: 3, lineHeight: 18 },
  rowTime: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, marginTop: 5 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentWarm,
    marginTop: 5,
  },
  divider: { height: 8 },
});
