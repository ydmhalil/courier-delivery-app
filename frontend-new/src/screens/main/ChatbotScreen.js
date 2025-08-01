import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Merhaba! Ben kurye asistanınızım. Paket, teslimat ve rota ile ilgili sorularınızda size yardımcı olabilirim. Size nasıl yardımcı olabilirim?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    console.log('🔍 ChatbotScreen - Current token:', token ? 'present' : 'missing');
  }, [token]);

  const API_BASE_URL = 'http://192.168.1.108:8000';

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

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

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        contextUsed: data.context_used
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        isBot: true,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isBot ? styles.botMessage : styles.userMessage
      ]}
    >
      <View style={[
        styles.messageBubble,
        message.isBot ? styles.botBubble : styles.userBubble,
        message.isError && styles.errorBubble
      ]}>
        {message.isBot && (
          <View style={styles.botHeader}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#666" />
            <Text style={styles.botLabel}>AI Asistan</Text>
            {message.contextUsed && (
              <View style={styles.contextBadge}>
                <Text style={styles.contextText}>Veri</Text>
              </View>
            )}
          </View>
        )}
        <Text style={[
          styles.messageText,
          message.isBot ? styles.botText : styles.userText
        ]}>
          {message.text}
        </Text>
        <Text style={[
          styles.timestamp,
          message.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  const quickQuestions = [
    "Bugün kaç paketim var?",
    "Hangi bölgelerde teslimatım var?",
    "Bekleyen paketlerim nelerdir?",
    "Bugünkü rotam nasıl?",
    "Teslimat istatistiklerim nedir?"
  ];

  const sendQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#2196F3" />
        <Text style={styles.headerTitle}>AI Kurye Asistanı</Text>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Çevrimiçi</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {messages.length === 1 && (
        <ScrollView 
          horizontal 
          style={styles.quickQuestionsContainer}
          showsHorizontalScrollIndicator={false}
        >
          {quickQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickQuestionButton}
              onPress={() => sendQuickQuestion(question)}
            >
              <Text style={styles.quickQuestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Kurye işlerinizle ilgili sorunuzu yazın..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={(!inputText.trim() || isLoading) ? '#ccc' : '#fff'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  loadingBubble: {
    paddingVertical: 16,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  botLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  contextBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contextText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickQuestionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginHorizontal: 2,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
});

export default ChatbotScreen;
