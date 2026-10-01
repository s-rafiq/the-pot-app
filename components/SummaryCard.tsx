import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

type SummaryCardProps = {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
  align?: 'left' | 'center';
  size?: 'normal' | 'large';
};

export function SummaryCard({ label, value, style, align = 'left', size = 'normal' }: SummaryCardProps) {
  return (
    <View style={[styles.card, style, { alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <Text style={[styles.cardLabel, align === 'center' && { textAlign: 'center' }, size === 'large' && { fontSize: 28, fontWeight: '700', marginBottom: 8 }]}>{label}</Text>
      <View style={{ flex: 1, justifyContent: 'center', width: '100%', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <Text 
          style={[
            styles.value, 
            align === 'center' && { textAlign: 'center' },
            size === 'large' && { fontSize: 64 }
          ]} 
          adjustsFontSizeToFit 
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
  },
});