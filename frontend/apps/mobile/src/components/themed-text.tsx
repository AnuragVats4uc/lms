import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17,
  },
  smallBold: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.14,
    lineHeight: 20,
  },
  default: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -0.96,
    lineHeight: 58,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  link: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.14,
    lineHeight: 20,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17,
  },
});
