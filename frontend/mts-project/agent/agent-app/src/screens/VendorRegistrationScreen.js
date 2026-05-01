import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, Alert, StatusBar, ActivityIndicator } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { User, MapPin, Briefcase, Phone, CheckCircle2, FileText, Smartphone, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, agentService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAgentCategoryMeta } from '../utils/categoryMeta';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;

const FALLBACK_CATEGORIES = [
  { category_id: 1, category_name: 'Plumbing', icon_name: 'plumbing' },
  { category_id: 2, category_name: 'Electrician', icon_name: 'electrical' },
  { category_id: 3, category_name: 'AC Repair', icon_name: 'cooling' },
  { category_id: 4, category_name: 'Cleaning', icon_name: 'cleaning' },
  { category_id: 5, category_name: 'Carpenter', icon_name: 'carpentry' },
];

export default function VendorRegistrationScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  
  // Step 1: Mobile/Email OTP State
  const [authInput, setAuthInput] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef(null);
  const isPhone = authInput.trim().length > 0 && /^\d+$/.test(authInput.trim());

   useEffect(() => {
        let timer;
        if (showOtp && resendSeconds > 0) {
            timer = setInterval(() => {
                setResendSeconds((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showOtp, resendSeconds]);

  const focusOtpInput = () => {
      setTimeout(() => {
          otpInputRef.current?.focus?.();
      }, 10);
  };

  useEffect(() => {
      if (showOtp) {
          focusOtpInput();
      }
  }, [showOtp]);

  // Step 2: Business Profile State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  // Step 3: Service Categories State
  const [selectedServices, setSelectedServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
      const loadCategories = async () => {
          try {
              const response = await agentService.getCategories();
              const nextCategories = Array.isArray(response.data?.data) ? response.data.data : [];
              setCategories(nextCategories.length > 0 ? nextCategories : FALLBACK_CATEGORIES);
          } catch (error) {
              console.warn('Failed to load service categories for agent onboarding.', error);
              setCategories(FALLBACK_CATEGORIES);
          } finally {
              setCategoriesLoading(false);
          }
      };

      loadCategories();
  }, []);

  // ---- Handlers ----

  const handleSendOtp = async () => {
        setOtpError('');
        if (!authInput.trim()) return;
        try {
            const response = await authService.sendVendorRegistrationOtp(authInput.trim());
            setShowOtp(true);
            setOtp('');
            setResendSeconds(30);
            if (response?.data?.debugOtp) {
                Alert.alert('OTP Sent', `Use this OTP for testing: ${response.data.debugOtp}`);
            }
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to send OTP');
        }
  };

  const handleVerifyOtp = async () => {
      setOtpError('');
      if (otp.length < OTP_LENGTH) {
          setOtpError('Invalid OTP');
          return;
      }
      try {
          const response = await authService.verifyVendorRegistrationOtp(authInput.trim(), otp);
          if (response.data.success) {
              if (isPhone) {
                  setMobileNumber(authInput.trim());
                  setWhatsappNumber(authInput.trim());
                  setEmailAddress('');
              } else {
                  setEmailAddress(authInput.trim());
                  setMobileNumber('');
                  setWhatsappNumber('');
              }
              setStep(2);
          }
      } catch (error) {
          const message = error?.response?.data?.message || 'Invalid OTP';
          setOtpError(message);
          Alert.alert('Error', message);
      }
  };

  const handleOtpChange = (text) => {
        if (otpError) {
            setOtpError('');
        }
        const digits = text.replace(/[^0-9]/g, '');

        const normalizedOtp = digits.slice(0, OTP_LENGTH);
        setOtp(normalizedOtp);

        if (normalizedOtp.length >= OTP_LENGTH) {
            otpInputRef.current?.blur?.();
        }
  };

  const toggleService = (id) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
      if (submitting) {
          return;
      }

      try {
          setSubmitting(true);

          let agent = null;
          try {
              const profileResponse = await agentService.getProfile();
              agent = profileResponse.data?.data || null;

              if (agent) {
                  await AsyncStorage.setItem('userData', JSON.stringify(agent));
              }
          } catch (profileError) {
              const agentData = await AsyncStorage.getItem('userData');
              agent = agentData ? JSON.parse(agentData) : null;
          }
          
          if (!agent) {
               Alert.alert('Error', 'Agent information not found. Please log in again.');
               return;
          }

          if (agent.approval_status !== 'approved') {
              Alert.alert('Approval Pending', 'Only admin-approved agents can onboard vendors.');
              return;
          }

          const registrationData = {
              mobile: mobileNumber || undefined,
              email: emailAddress || undefined,
              full_name: ownerName,
              business_name: businessName,
              address: address,
              whatsapp_number: whatsappNumber || mobileNumber || undefined,
              description,
              categories: selectedServices,
              agent_code: agent.referral_code || '', 
          };

          const response = await authService.registerVendor(registrationData);
          if (response.data.success) {
              Alert.alert('Success', 'Vendor Registered successfully!');
              navigation.goBack();
          }
      } catch (error) {
          Alert.alert('Registration Failed', error?.response?.data?.message || 'Failed to register vendor');
      } finally {
          setSubmitting(false);
      }
  };

  // ---- Renders ----

  const renderStepIndicator = () => (
      <View style={styles.indicatorContainer}>
           <View style={styles.indicatorStep}>
               <View style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : null]}>
                   <Text style={[styles.stepText, step >= 1 ? styles.stepTextActive : null]}>1</Text>
               </View>
               <Text style={styles.stepLabel}>Verify</Text>
           </View>
           <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : null]} />
           <View style={styles.indicatorStep}>
               <View style={[styles.stepCircle, step >= 2 ? styles.stepCircleActive : null]}>
                   <Text style={[styles.stepText, step >= 2 ? styles.stepTextActive : null]}>2</Text>
               </View>
               <Text style={styles.stepLabel}>Profile</Text>
           </View>
           <View style={[styles.stepLine, step >= 3 ? styles.stepLineActive : null]} />
            <View style={styles.indicatorStep}>
               <View style={[styles.stepCircle, step >= 3 ? styles.stepCircleActive : null]}>
                   <Text style={[styles.stepText, step >= 3 ? styles.stepTextActive : null]}>3</Text>
               </View>
               <Text style={styles.stepLabel}>Services</Text>
           </View>
      </View>
  );

  const renderStep1 = () => (
      <View style={styles.stepContent}>
           <Text style={styles.largeTitle}>
                {showOtp ? 'Verification' : 'Register New Vendor'}
            </Text>
            <Text style={styles.stepSubtitle}>
                {showOtp
                    ? `Enter the 6-digit code sent to\n${authInput.trim()}`
                    : 'Enter the vendor\'s mobile number or email to start registration'}
            </Text>

            {!showOtp ? (
                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        {isPhone && (
                            <View style={styles.prefixBox}>
                                <Text style={styles.prefixText}>+91</Text>
                            </View>
                        )}
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number / Email"
                            placeholderTextColor="#94a3b8"
                            value={authInput}
                            onChangeText={setAuthInput}
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSendOtp}
                        activeOpacity={0.8}
                        style={[styles.mainButton, !authInput ? styles.buttonDisabled : null]}
                        disabled={!authInput}
                    >
                         <LinearGradient
                            colors={authInput ? ['#2563eb', '#1d4ed8'] : ['#94a3b8', '#94a3b8']}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>Send OTP</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.formContainer}>
                    <TouchableOpacity activeOpacity={1} onPress={focusOtpInput}>
                        <View style={styles.otpOuterContainer}>
                            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                                const digit = otp[i] || '';
                                const isActive = i === Math.min(otp.length, OTP_LENGTH - 1);
                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.otpBox,
                                            digit ? styles.otpBoxActive : null,
                                            isActive ? styles.otpBoxFocused : null,
                                        ]}
                                    >
                                        <Text style={styles.otpInput}>{digit}</Text>
                                    </View>
                                );
                            })}
                            <TextInput
                                ref={otpInputRef}
                                style={styles.hiddenOtpInput}
                                keyboardType="number-pad"
                                maxLength={OTP_LENGTH}
                                value={otp}
                                onChangeText={handleOtpChange}
                                textContentType="oneTimeCode"
                                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                                blurOnSubmit={false}
                                caretHidden
                                autoFocus={showOtp}
                                showSoftInputOnFocus
                            />
                        </View>
                    </TouchableOpacity>
                    {otpError ? (
                        <Text style={styles.otpErrorText}>{otpError}</Text>
                    ) : null}
                    <TouchableOpacity
                        onPress={handleVerifyOtp}
                        activeOpacity={0.8}
                        style={styles.mainButton}
                    >
                        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.buttonGradient}>
                            <Text style={styles.buttonText}>Verify OTP</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                     <TouchableOpacity onPress={() => { setShowOtp(false); setOtp(''); setOtpError(''); }} style={styles.textAction}>
                        <Text style={styles.textActionLabel}>Change number / email</Text>
                    </TouchableOpacity>
                </View>
            )}
      </View>
  );

  const renderStep2 = () => (
      <View style={styles.stepContent}>
           <Text style={styles.largeTitle}>Business Profile</Text>
           <Text style={styles.stepSubtitle}>Complete the details below to create the vendor profile</Text>

           <View style={styles.formSection}>
              <View style={styles.formControl}>
                 <Text style={styles.label}>Business Name</Text>
                 <View style={styles.cardInput}>
                    <Briefcase color="#94a3b8" size={20} style={styles.inputIcon}/>
                    <TextInput 
                        placeholder="e.g. Acme Plumbing Solutions"
                        placeholderTextColor="#94a3b8"
                        style={styles.inputField}
                        value={businessName}
                        onChangeText={setBusinessName}
                    />
                 </View>
              </View>

              <View style={styles.formControl}>
                 <Text style={styles.label}>Owner Name</Text>
                 <View style={styles.cardInput}>
                    <User color="#94a3b8" size={20} style={styles.inputIcon}/>
                    <TextInput 
                        placeholder="Individual/Owner Full Name"
                        placeholderTextColor="#94a3b8"
                        style={styles.inputField}
                        value={ownerName}
                        onChangeText={setOwnerName}
                    />
                 </View>
              </View>

              <View style={styles.row}>
                  <View style={styles.col}>
                     <Text style={styles.label}>Mobile</Text>
                     <View style={styles.cardInput}>
                         <Phone color="#94a3b8" size={16} style={styles.inputIconSmall}/>
                         <TextInput 
                            placeholder="Primary"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            style={styles.inputFieldSmall}
                            value={mobileNumber}
                            onChangeText={(value) => {
                                const sanitized = value.replace(/[^0-9]/g, '');
                                const shouldSyncWhatsapp = !whatsappNumber || whatsappNumber === mobileNumber;
                                setMobileNumber(sanitized);
                                if (shouldSyncWhatsapp) {
                                    setWhatsappNumber(sanitized);
                                }
                            }}
                        />
                     </View>
                  </View>
                  <View style={styles.col}>
                     <Text style={styles.label}>WhatsApp</Text>
                     <View style={styles.cardInput}>
                         <Smartphone color="#22c55e" size={18} style={styles.inputIconSmall}/>
                         <TextInput 
                            placeholder="WhatsApp"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            style={styles.inputFieldSmall}
                            value={whatsappNumber}
                            onChangeText={setWhatsappNumber}
                        />
                     </View>
                  </View>
              </View>

              <View style={styles.formControl}>
                 <Text style={styles.label}>Email</Text>
                 <View style={styles.cardInput}>
                    <Text style={styles.inputIcon}>✉</Text>
                    <TextInput
                        placeholder="vendor@example.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.inputField}
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                    />
                 </View>
              </View>

               <View style={styles.formControl}>
                 <Text style={styles.label}>Business Description</Text>
                 <View style={[styles.cardInput, styles.textAreaContainer]}>
                    <FileText color="#94a3b8" size={20} style={styles.textAreaIcon}/>
                    <TextInput 
                        placeholder="Describe services, specialities, etc."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={styles.textArea}
                        value={description}
                        onChangeText={setDescription}
                    />
                 </View>
              </View>

               <View style={styles.formControl}>
                 <Text style={styles.label}>Business Address</Text>
                 <View style={styles.cardInput}>
                    <MapPin color="#ef4444" size={20} style={styles.inputIcon}/>
                    <TextInput 
                        placeholder="Street address, locality, city"
                        placeholderTextColor="#94a3b8"
                        style={styles.inputField}
                        value={address}
                        onChangeText={setAddress}
                    />
                 </View>
              </View>

           </View>
      </View>
  );

  const renderStep3 = () => (
      <View style={styles.stepContent}>
           <Text style={styles.largeTitle}>Service Categories</Text>
           <Text style={styles.stepSubtitle}>Select all categories that apply to this vendor</Text>

           <View style={styles.servicesGrid}>
               {categoriesLoading ? (
                   <View style={styles.servicesLoading}>
                       <ActivityIndicator size="small" color="#2563eb" />
                       <Text style={styles.servicesLoadingText}>Loading categories...</Text>
                   </View>
               ) : null}
               {(categoriesLoading ? [] : categories).map((service) => {
                   const serviceId = String(service.category_id);
                   const isSelected = selectedServices.includes(serviceId);
                   const meta = getAgentCategoryMeta(service.icon_name, service.category_name);
                   const IconComponent = meta.icon;
                   return (
                       <TouchableOpacity
                           key={serviceId}
                           onPress={() => toggleService(serviceId)}
                           activeOpacity={0.7}
                           style={[styles.serviceItem, isSelected ? styles.serviceItemSelected : null]}
                       >   
                           <View style={[styles.serviceIconWrap, { backgroundColor: meta.bg }]}>
                               <IconComponent color={meta.color} size={20} />
                           </View>
                           <View style={styles.serviceTextBlock}>
                               <Text style={[styles.serviceName, isSelected ? styles.serviceNameActive : null]}>
                                   {service.category_name}
                               </Text>
                               <Text style={styles.serviceMetaText}>{service.icon_name || 'general'}</Text>
                           </View>
                           <View style={[styles.checkbox, isSelected ? styles.checkboxActive : null]}>
                                {isSelected && <CheckCircle2 color="#fff" size={16} />}
                           </View>
                       </TouchableOpacity>
                   )
               })}
           </View>
      </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" />
        {/* Header Bar */}
        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.topHeader}>
             <TouchableOpacity 
                onPress={() => {
                    if (step > 1) setStep(step - 1);
                    else navigation.goBack();
                }} 
                style={styles.backButton}
             >
                <ArrowLeft color="#fff" size={24} />
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Vendor Registration</Text>
             <View style={styles.headerRight} />
        </LinearGradient>

        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.mainWrapper}>
                    {renderStepIndicator()}
                    
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </View>
            </ScrollView>

            {/* Bottom Button Area for Steps 2 and 3 */}
            {step > 1 && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={() => {
                            if (step === 2) setStep(3);
                            else if (step === 3) handleSubmit();
                        }}
                        activeOpacity={0.9}
                        disabled={submitting}
                    >
                        <LinearGradient colors={submitting ? ['#94a3b8', '#94a3b8'] : ['#2563eb', '#1d4ed8']} style={styles.buttonGradient}>
                            <Text style={styles.submitButtonText}>
                                {step === 2 ? 'Save & Continue' : submitting ? 'Registering...' : 'Register Vendor'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                 </View>
            )}
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topHeader: {
        paddingTop: 10,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 40,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    mainWrapper: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 24,
        paddingHorizontal: 20,
    },
    indicatorStep: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#2563eb',
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    stepTextActive: {
        color: '#fff',
    },
    stepLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '500',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 10,
        marginTop: -16,
    },
    stepLineActive: {
        backgroundColor: '#2563eb',
    },
    stepContent: {
        flex: 1,
    },
    largeTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 24,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        height: 58,
        marginBottom: 20,
        overflow: 'hidden',
    },
    prefixBox: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },
    prefixText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#334155',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    mainButton: {
        height: 58,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    buttonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    otpOuterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    otpBox: {
        width: (Math.min(width, 500) - 72) / 6,
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpBoxActive: {
        borderColor: '#2563eb',
        backgroundColor: '#f8faff',
    },
    otpBoxFocused: {
        borderColor: '#60a5fa',
    },
    otpInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        width: '100%',
    },
    hiddenOtpInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.02,
        color: 'transparent',
        backgroundColor: 'transparent',
    },
    otpErrorText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 14,
    },
    textAction: {
        marginTop: 20,
        alignItems: 'center',
    },
    textActionLabel: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        marginBottom: 20,
    },
    formControl: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
        marginLeft: 4,
    },
    cardInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 14,
        height: 54,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputField: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    col: {
        width: '48%',
    },
    inputIconSmall: {
        marginRight: 6,
    },
    inputFieldSmall: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
    },
    textAreaContainer: {
        height: 100,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textAreaIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    textArea: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        height: '100%',
    },
    uploadSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f1f5f9',
        padding: 20,
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        marginTop: 10,
    },
    uploadItem: {
        alignItems: 'center',
    },
    uploadIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    uploadLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    servicesGrid: {
        marginTop: 10,
    },
    servicesLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    servicesLoadingText: {
        marginLeft: 10,
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    serviceItemSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#f0f7ff',
    },
    serviceIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    serviceTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    checkboxActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#475569',
    },
    serviceNameActive: {
        color: '#1e40af',
        fontWeight: 'bold',
    },
    serviceMetaText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    bottomBar: {
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    submitButton: {
        height: 58,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

