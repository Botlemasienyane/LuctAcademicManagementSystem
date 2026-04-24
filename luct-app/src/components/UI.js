import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { getProgressTone, getRatingTone, getRoleLabel, getRoleTone, getStatusLabel, getStatusTone, useTheme } from '../context/ThemeContext';

export const Card = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: theme.bgCard,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: theme.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: theme.border,
      }, style]}
    >
      {children}
    </View>
  );
};

export const Btn = ({ title, onPress, variant = 'primary', size = 'md', icon, disabled }) => {
  const { theme } = useTheme();
  const sizes = { sm: { px: 12, py: 7, fs: 12 }, md: { px: 16, py: 11, fs: 14 }, lg: { px: 20, py: 14, fs: 16 } };
  const s = sizes[size];
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const bgColor = isDanger ? theme.danger : isPrimary ? theme.accent : 'transparent';
  const txtColor = isDanger ? theme.secondary : isPrimary ? theme.accentText : theme.accent;
  const border = isOutline || isDanger ? { borderWidth: 1, borderColor: isDanger ? theme.danger : theme.accent } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[{
        backgroundColor: bgColor,
        borderRadius: 10,
        paddingHorizontal: s.px,
        paddingVertical: s.py,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }, border]}
    >
      {icon ? <Text style={{ fontSize: s.fs, marginRight: 6 }}>{icon}</Text> : null}
      <Text style={{ color: txtColor, fontSize: s.fs, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
};

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  style,
  secureTextEntry,
  editable = true,
  autoCapitalize = 'sentences',
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        autoCapitalize={autoCapitalize}
        style={[{
          backgroundColor: theme.bgInput,
          color: editable ? theme.text : theme.textMuted,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.border,
          fontSize: 14,
          minHeight: multiline ? (numberOfLines || 3) * 22 + 24 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }, style]}
      />
    </View>
  );
};

export const Badge = ({ label, color }) => {
  const { theme } = useTheme();
  const roleTone = getRoleTone(label);
  const statusTone = getStatusTone(theme, color || label);
  const ratingTone = getRatingTone(theme);
  const colors = {
    fmg: roleTone,
    pl: roleTone,
    prl: roleTone,
    lecturer: roleTone,
    student: roleTone,
    submitted: statusTone,
    reviewed: statusTone,
    rating: ratingTone,
    default: { bg: theme.bgSecondary, text: theme.text },
  };
  const c = colors[color] || colors.default;
  const textLabel =
    ['fmg', 'pl', 'prl', 'yl', 'lecturer', 'student'].includes((label || '').toLowerCase())
      ? getRoleLabel(label)
      : ['submitted', 'reviewed'].includes((label || '').toLowerCase())
      ? getStatusLabel(label)
      : label;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: c.border ? 1 : 0, borderColor: c.border }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>{textLabel}</Text>
    </View>
  );
};

export const SectionHeader = ({ title, count }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
      <Text style={{ color: theme.bgText || theme.text, fontSize: 17, fontWeight: '700', flex: 1 }}>{title}</Text>
      {count !== undefined ? (
        <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const SearchBar = ({ value, onChangeText, placeholder }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgInput, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginRight: 8 }}>Search</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={theme.textMuted}
        style={{ flex: 1, color: theme.text, fontSize: 14, paddingVertical: 10 }}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const EmptyState = ({ icon, message }) => {
  const { theme } = useTheme();
  const iconLabelMap = {
    REP: 'Reports',
    CLS: 'Classes',
    CRS: 'Courses',
    ATT: 'Attendance',
    RATE: 'Ratings',
    LEC: 'Lectures',
    INFO: 'Information',
    MON: 'Insights',
  };
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{ fontSize: 14, marginBottom: 12, color: theme.textMuted, fontWeight: '700' }}>
        {iconLabelMap[icon] || icon || 'Information'}
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>{message || 'Nothing to show'}</Text>
    </View>
  );
};

export const Loader = () => {
  const { theme } = useTheme();
  return <ActivityIndicator size="large" color={theme.accent} style={{ marginVertical: 30 }} />;
};

export const StatCard = ({ label, value, icon, color }) => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.bgCard, borderRadius: 14, padding: 16, flex: 1, marginHorizontal: 4, borderWidth: 1, borderColor: theme.border }}>
      {icon ? <Text style={{ fontSize: 12, marginBottom: 8, fontWeight: '700', color: theme.textMuted }}>{icon}</Text> : null}
      <Text style={{ color: color || theme.accent, fontSize: 26, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
};
