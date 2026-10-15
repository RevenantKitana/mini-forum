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
import axios from 'axios';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<Props> = ({ visible, onClose }) => {
  const { apiUrl, updateApiUrl } = useAuth();
  const [url, setUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const rootUrl = cleanUrl.replace(/\/api\/v1$/, '');
      const res = await axios.get(`${rootUrl}/`, { timeout: 5000 });
      if (res.data?.success) {
        setTestResult({ success: true, msg: 'Kết nối thành công tới Mini Forum API!' });
      } else {
        setTestResult({ success: true, msg: 'Kết nối thành công tới máy chủ!' });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `Lỗi kết nối: ${err.message || 'Không tìm thấy server'}. Hãy kiểm tra IP máy tính và cùng Wi-Fi.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateApiUrl(url);
      Alert.alert('Thành công', 'Đã lưu địa chỉ Backend API mới!');
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>⚙️ Cấu hình Backend API</Text>
          <Text style={styles.description}>
            Khi chạy bằng <Text style={{ fontWeight: 'bold', color: colors.primary }}>Expo Go (quét QR)</Text> trên điện thoại thật, cần nhập IP Wi-Fi của máy tính (ví dụ: <Text style={{ color: colors.warning }}>http://192.168.1.x:5000/api/v1</Text>).
          </Text>

          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.x:5000/api/v1"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {testResult && (
            <View
              style={[
                styles.resultBox,
                { backgroundColor: testResult.success ? '#064E3B' : '#7F1D1D' },
              ]}
            >
              <Text style={styles.resultText}>{testResult.msg}</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.testBtn]}
              onPress={handleTest}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>Kiểm tra kết nối</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.btnText}>Lưu cấu hình</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  resultBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtn: {
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
