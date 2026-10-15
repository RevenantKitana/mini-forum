import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { authService } from '../api/services';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to email
  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.sendOtp(email.trim().toLowerCase(), 'RESET_PASSWORD');
      if (res.success) {
        Alert.alert('Đã gửi mã', `Mã OTP đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư đến hoặc thư rác.`);
        setStep('OTP');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ mã OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOtp(email.trim().toLowerCase(), otp.trim(), 'RESET_PASSWORD');
      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep('PASSWORD');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        resetToken,
        newPassword,
      });

      if (res.success) {
        Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại.', [
          {
            text: 'Đăng nhập',
            onPress: () => {
              navigation.replace('Login');
            },
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <KeyRound size={36} color={colors.primary} />
          </View>

          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            {step === 'EMAIL' && 'Nhập email đã đăng ký tài khoản để nhận mã xác thực OTP.'}
            {step === 'OTP' && `Nhập mã xác thực gồm 6 số đã được gửi tới ${email}.`}
            {step === 'PASSWORD' && 'Nhập mật khẩu mới cho tài khoản của bạn.'}
          </Text>

          {/* Step 1: EMAIL */}
          {step === 'EMAIL' && (
            <>
              <View style={styles.inputContainer}>
                <Mail size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn..."
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Gửi mã OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'OTP' && (
            <>
              <View style={styles.inputContainer}>
                <ShieldCheck size={18} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã OTP..."
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Xác nhận mã OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp}>
                <Text style={styles.resendText}>Chưa nhận được mã? Gửi lại</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: PASSWORD */}
          {step === 'PASSWORD' && (
            <>
              <View style={styles.inputContainer}>
                <Lock size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)..."
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={[styles.inputContainer, { marginTop: 12 }]}>
                <Lock size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Đặt lại mật khẩu</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
