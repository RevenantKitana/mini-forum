import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ShieldAlert, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { reportService } from '../api/services';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: number;
  targetType: 'POST' | 'COMMENT' | 'USER';
}

const REASONS = [
  'Nội dung xúc phạm / thù ghét',
  'Spam hoặc quảng cáo trái phép',
  'Thông tin sai lệch / giả mạo',
  'Nội dung nhạy cảm / không phù hợp',
  'Lý do khác',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetId,
  targetType,
}) => {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (targetType === 'POST') {
        await reportService.reportPost(targetId, { reason: selectedReason, details: details.trim() || undefined });
      } else if (targetType === 'COMMENT') {
        await reportService.reportComment(targetId, { reason: selectedReason, details: details.trim() || undefined });
      } else {
        await reportService.reportUser(targetId, { reason: selectedReason, details: details.trim() || undefined });
      }

      Alert.alert('Thành công', 'Báo cáo của bạn đã được gửi tới đội ngũ quản trị viên kiểm duyệt.');
      setDetails('');
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShieldAlert size={20} color={colors.warning} />
              <Text style={styles.title}>Báo cáo vi phạm</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Chọn lý do báo cáo:</Text>
          <View style={styles.reasonsList}>
            {REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonOption, isSelected && styles.reasonOptionActive]}
                  onPress={() => setSelectedReason(r)}
                >
                  <View style={[styles.radio, isSelected && styles.radioActive]} />
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Chi tiết thêm (tuỳ chọn):</Text>
          <TextInput
            style={styles.input}
            placeholder="Mô tả cụ thể vi phạm..."
            placeholderTextColor={colors.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Gửi báo cáo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  reasonOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  reasonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceHover,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.error,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
