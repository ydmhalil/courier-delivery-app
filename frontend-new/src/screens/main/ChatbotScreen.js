import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  Linking,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Merhaba! Ben sizin akıllı kurye asistanınızım. Paket takibi, teslimat rotaları, hava durumu ve daha fazlası için buradayım. Size nasıl yardımcı olabilirim? 🚚",
      isBot: true,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const scrollViewRef = useRef(null);
  const { token } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingDot1 = useRef(new Animated.Value(0.3)).current;
  const typingDot2 = useRef(new Animated.Value(0.3)).current;
  const typingDot3 = useRef(new Animated.Value(0.3)).current;

  const API_BASE_URL = 'http://192.168.1.108:8000';

  useEffect(() => {
    console.log('🔍 ChatbotScreen - Current token:', token ? 'present' : 'missing');
  }, [token]);

  useEffect(() => {
    // Fade in animation for new messages
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      startTypingAnimation();
    }
  }, [isTyping]);

  const startTypingAnimation = () => {
    const animateTyping = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDot1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(typingDot1, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(typingDot2, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(typingDot2, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 200);

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(typingDot3, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(typingDot3, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 400);
    };

    animateTyping();
  };

  // Text-to-Speech fonksiyonu
  const speakMessage = async (text) => {
    if (!speechEnabled || isSpeaking || !text) return;
    
    try {
      setIsSpeaking(true);
      
      // Özel karakterleri temizle
      const cleanText = text
        .replace(/🚚|📦|🌤️|🗺️|📍|😔|🤖|✅|📊/g, '') // Emojileri kaldır
        .replace(/\n/g, ' ') // Satır sonlarını boşlukla değiştir
        .trim();
      
      if (cleanText.length === 0) {
        setIsSpeaking(false);
        return;
      }

      console.log('🔊 TTS başlatılıyor:', cleanText.substring(0, 50) + '...');
      
      await Speech.speak(cleanText, {
        language: 'tr-TR',
        pitch: 1.0,
        rate: 0.85,
        quality: Speech.VoiceQuality.Enhanced,
        onDone: () => {
          console.log('🔊 TTS tamamlandı');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('🔊 TTS hatası:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('🔊 TTS durduruldu');
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('🔊 Speech error:', error);
      setIsSpeaking(false);
      Alert.alert('Hata', 'Sesli okuma özelliği şu anda kullanılamıyor.');
    }
  };

  // Speech'i durdur
  const stopSpeaking = async () => {
    try {
      console.log('🔇 TTS durduruluyor...');
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('🔇 Stop speech error:', error);
      setIsSpeaking(false);
    }
  };

  // Speech toggle fonksiyonu
  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      setSpeechEnabled(!speechEnabled);
      if (speechEnabled) {
        // TTS kapatılırken konuşmayı durdur
        stopSpeaking();
      }
    }
  };

  // Sesli mesaj gönderme
  const handleVoiceMessage = (text) => {
    if (!text.trim()) return;
    setInputText(text);
    setTimeout(() => sendMessage(), 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      console.log('🔍 Sending chat request with token:', token ? 'present' : 'missing');
      const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.text
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // Simulate typing delay
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          isBot: true,
          timestamp: new Date(),
          contextUsed: data.context_used,
          type: 'text'
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        // Otomatik TTS (kullanıcı tercihi varsa ve yeni mesaj)
        if (speechEnabled && !isSpeaking) {
          setTimeout(() => {
            console.log('🔊 Otomatik TTS başlatılıyor...');
            speakMessage(data.response);
          }, 800);
        }
      }, 1500);

    } catch (error) {
      console.error('Chat error:', error);
      setTimeout(() => {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin. 😔",
          isBot: true,
          timestamp: new Date(),
          type: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputText(text);
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  const handleMoreMenuPress = () => {
    setShowMoreMenu(true);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Sohbeti Temizle',
      'Tüm mesaj geçmişi silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: () => {
            setMessages([{
              id: 1,
              text: "Merhaba! Ben sizin akıllı kurye asistanınızım. Paket takibi, teslimat rotaları, hava durumu ve daha fazlası için buradayım. Size nasıl yardımcı olabilirim? 🚚",
              isBot: true,
              timestamp: new Date(),
              type: 'text'
            }]);
            setShowMoreMenu(false);
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'AI Kurye Asistanı Hakkında',
      '🤖 Bu asistan Google Gemini AI ile desteklenmektedir.\n\n✅ Paket takibi ve yönetimi\n✅ Teslimat rota optimizasyonu\n✅ Hava durumu bilgileri\n✅ Gerçek zamanlı veri analizi\n\nSürüm: 1.0.0',
      [{ text: 'Tamam', onPress: () => setShowMoreMenu(false) }]
    );
  };

  const renderMessage = (message, index) => {
    const isBot = message.isBot;
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || prevMessage.isBot !== isBot;
    
    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
          { opacity: fadeAnim }
        ]}
      >
        {isBot && showAvatar && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#6B73FF" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble,
          !showAvatar && isBot && styles.continueBubble
        ]}>
          <View style={styles.messageContent}>
            <Text style={[
              styles.messageText,
              isBot ? styles.botText : styles.userText
            ]}>
              {message.text}
            </Text>
            
            {/* Bot mesajlarına speaker butonu */}
            {isBot && (
              <TouchableOpacity
                style={[
                  styles.speakerButton,
                  isSpeaking && styles.speakerButtonActive
                ]}
                onPress={() => speakMessage(message.text)}
                disabled={isSpeaking}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isSpeaking ? "volume-high" : "volume-medium-outline"} 
                  size={14} 
                  color={isSpeaking ? "#EF4444" : "#6B73FF"} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          {message.contextUsed && (
            <View style={styles.contextIndicator}>
              <Ionicons name="database-outline" size={12} color="#6B73FF" />
              <Text style={styles.contextText}>📊 Gerçek verileriniz kullanıldı</Text>
            </View>
          )}
          
          <Text style={[
            styles.timestamp,
            isBot ? styles.botTimestamp : styles.userTimestamp
          ]}>
            {message.timestamp.toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {!isBot && showAvatar && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#6B73FF" />
        </View>
        <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
          <View style={styles.typingIndicator}>
            <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
          </View>
        </View>
      </View>
    );
  };

  const quickReplies = [
    "📦 Bugün kaç paketim var?",
    "🌤️ Hava durumu nasıl?",
    "🗺️ En iyi rota hangisi?",
    "📍 Bekleyen teslimatlar"
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#6B73FF', '#9C27B0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.botInfo}>
            <View style={styles.botHeaderAvatar}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.botDetails}>
              <Text style={styles.botName}>AI Kurye Asistanı</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Çevrimiçi</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={handleMoreMenuPress}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        automaticallyAdjustContentInsets={false}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {renderTypingIndicator()}
        
        {/* Quick Replies */}
        {messages.length <= 1 && (
          <View style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>Hızlı Sorular:</Text>
            <View style={styles.quickReplies}>
              {quickReplies.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyButton}
                  onPress={() => handleQuickReply(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* More Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMoreMenu}
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seçenekler</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={[styles.menuText, { color: '#FF4444' }]}>Sohbeti Temizle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
              <Ionicons name="information-circle-outline" size={20} color="#6B73FF" />
              <Text style={styles.menuText}>AI Asistan Hakkında</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.cancelItem]} 
              onPress={() => setShowMoreMenu(false)}
            >
              <Ionicons name="close-outline" size={20} color="#666" />
              <Text style={[styles.menuText, { color: '#666' }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Kurye işlerinizle ilgili sorunuzu yazın..."
              placeholderTextColor="#A0A0A0"
              multiline={true}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              textBreakStrategy="simple"
              scrollEnabled={true}
            />
            
            {/* Speaker Toggle */}
            <View style={styles.voiceControls}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  speechEnabled && styles.speechEnabledButton,
                  isSpeaking && styles.voiceButtonActive
                ]}
                onPress={toggleSpeech}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={speechEnabled ? (isSpeaking ? "volume-high" : "volume-medium") : "volume-mute"} 
                  size={18} 
                  color={speechEnabled ? (isSpeaking ? "#EF4444" : "#3B82F6") : "#6B7280"} 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.inputFooter}>
            <Text style={styles.inputHelper}>
              AI asistanınız paketler, rotalar ve daha fazlası hakkında sorularınızı yanıtlayabilir
            </Text>
            {speechEnabled && (
              <Text style={styles.speechIndicator}>
                🔊 Sesli yanıtlar etkin
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  botHeaderAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  botDetails: {
    flex: 1,
  },
  botName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  moreButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#6B73FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    minWidth: width * 0.5,
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: '#6B73FF',
    borderBottomRightRadius: 5,
  },
  continueBubble: {
    borderBottomLeftRadius: 20,
    marginLeft: 45,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  speakerButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  typingBubble: {
    paddingVertical: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  botText: {
    color: '#2C3E50',
    fontWeight: '400',
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  contextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6B73FF',
  },
  contextText: {
    fontSize: 11,
    color: '#6B73FF',
    marginLeft: 4,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
    fontWeight: '400',
  },
  botTimestamp: {
    color: '#A0A0A0',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B73FF',
    marginHorizontal: 2,
  },
  quickRepliesContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B73FF',
    marginBottom: 12,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickReplyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReplyText: {
    fontSize: 14,
    color: '#6B73FF',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'android' ? 0 : undefined,
  },
  inputWrapper: {
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    color: '#2C3E50',
    textAlignVertical: 'top',
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  speechEnabledButton: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6B73FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B73FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#C0C0C0',
    shadowOpacity: 0,
    elevation: 0,
  },
  inputHelper: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14,
  },
  inputFooter: {
    alignItems: 'center',
  },
  speechIndicator: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  cancelItem: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#2C3E50',
    fontWeight: '500',
  },
});

export default ChatbotScreen;
