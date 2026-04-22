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
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Row = { id: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; tone: string; title: string; body: string; time: string; unread?: boolean };

const TODAY: Row[] = [
  {
    id: '1',
    icon: 'menu-book',
    tone: '#E8F0FE',
    title: 'Yeni ders hazır',
    body: 'Başlangıç paketinde bir sonraki sahne açıldı.',
    time: '5 dk önce',
    unread: true,
  },
  {
    id: '2',
    icon: 'emoji-events',
    tone: '#FFF4E5',
    title: 'Başarı açıldı',
    body: 'Üst üste 5 gün tamamladın, böyle devam!',
    time: '1 sa önce',
    unread: true,
  },
];

const YESTERDAY: Row[] = [
  {
    id: '3',
    icon: 'person',
    tone: '#E8F8F0',
    title: 'Yeni içerik',
    body: 'Telaffuz ipuçları güncellendi.',
    time: 'Dün',
    unread: false,
  },
  {
    id: '4',
    icon: 'card-giftcard',
    tone: '#FCE8F3',
    title: 'Özel teklif',
    body: 'Bu hafta premium denemesi için davet.',
    time: 'Dün',
    unread: false,
  },
];

function RowItem({ row }: { row: Row }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: row.tone }]}>
        <MaterialIcons name={row.icon} size={20} color={colors.primaryAccent} />
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
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Bildirimler</Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.markAll}>Tümünü oku</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>Bugün</Text>
          {TODAY.map(r => (
            <RowItem key={r.id} row={r} />
          ))}
          <View style={styles.divider} />
          <Text style={styles.section}>Dün</Text>
          {YESTERDAY.map(r => (
            <RowItem key={r.id} row={r} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27, 28, 28, 0.35)' },
  card: {
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    maxHeight: '78%',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  title: { fontFamily: F.bold, fontSize: 17, color: colors.textPrimary },
  markAll: { fontFamily: F.semibold, fontSize: 13, color: colors.primaryAccent },
  scroll: { paddingHorizontal: 12 },
  section: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowMid: { flex: 1, paddingRight: 8 },
  rowTitle: { fontFamily: F.semibold, fontSize: 15, color: colors.textPrimary },
  rowBody: { fontFamily: F.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  rowTime: { fontFamily: F.regular, fontSize: 11, color: colors.textMuted, marginTop: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryAccent,
    marginTop: 6,
  },
  divider: { height: 8 },
});
