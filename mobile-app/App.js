import Markdown from 'react-native-markdown-display';
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, Alert, Modal, KeyboardAvoidingView, Platform, 
  Linking, Keyboard, Share, Switch, Dimensions, StatusBar, 
  Animated, LogBox, LayoutAnimation, UIManager, BackHandler 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import * as Speech from 'expo-speech'; 
import { Audio } from 'expo-av'; 
import * as FileSystem from 'expo-file-system/legacy'; // FIXED IMPORT
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import axios from 'axios';
import LottieView from 'lottie-react-native'; 
import { Ionicons } from '@expo/vector-icons'; 

// --- 1. CONFIGURATION ---
LogBox.ignoreLogs(['Expo AV has been deprecated']);

// Enable Animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// --- LOCAL MUSIC ASSETS ---
// Ensure you have these 5 files in 'assets/sounds/'
const MUSIC_TRACKS = [
  { name: 'Morning with Birds', file: require('./assets/sounds/morning-with-birds.mp3') },
  { name: 'Forest Lullaby', file: require('./assets/sounds/forest-lullaby.mp3') },
  { name: 'Handpan Dream',  file: require('./assets/sounds/handpan-dream.mp3') },
  { name: 'Meditation Music', file: require('./assets/sounds/meditation-music.mp3') }, 
  { name: 'Yoga Music', file: require('./assets/sounds/yoga-music.mp3') }  
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ROTATING SUGGESTIONS POOL
const SUGGESTION_POOLS = [
    ["Yoga for back pain?", "Morning yoga flow", "Meditation for sleep"],
    ["Yoga for stress relief", "Beginner flexibility", "Yoga for neck pain"],
    ["Power yoga for energy", "Yoga for digestion", "5 minute office yoga"],
    ["Yoga for balance", "Sun Salutation guide", "Breathing exercises"]
];

// --- 3. COMPONENTS ---
const SkeletonLoader = ({ theme }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);
    const Bar = ({ width, height }) => (
        <Animated.View style={{ opacity, width, height, backgroundColor: theme.textSecondary, borderRadius: 4, marginBottom: 8 }} />
    );
    return (
        <View style={[styles.aiBubble, { backgroundColor: theme.bubbleAI, width: '75%', padding: 20 }]}>
            <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
                 <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: theme.textSecondary, opacity: 0.3, marginRight: 8}} />
                 <Bar width="30%" height={10} />
            </View>
            <Bar width="90%" height={12} />
            <Bar width="80%" height={12} />
            <Bar width="95%" height={12} />
        </View>
    );
};

export default function App() {
  // --- STATE ---
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null); 
  
  // Voice
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);

  // Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false); 
  
  // Data
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [streak, setStreak] = useState(1);
  const [dailyCount, setDailyCount] = useState(0); 
  const [weeklyStats, setWeeklyStats] = useState({});
  const [sound, setSound] = useState();
  const [musicIndex, setMusicIndex] = useState(-1);
  const [currentSuggestions, setCurrentSuggestions] = useState(SUGGESTION_POOLS[0]);

  const listRef = useRef(null);
  const API_URL = 'https://wellness-rag-micro-app.onrender.com/ask'; 

  const theme = {
    bgColors: isDarkMode ? ['#0f2027', '#203a43'] : ['#eefcf3', '#ffffff'],
    headerBg: isDarkMode ? '#141E30' : '#eefcf3',
    headerText: isDarkMode ? '#a8e063' : '#2d6a4f',
    bubbleUser: isDarkMode ? '#2c5364' : '#2d6a4f',
    bubbleAI: isDarkMode ? '#243B55' : 'white',
    textPrimary: isDarkMode ? '#E0E0E0' : '#333',
    textSecondary: isDarkMode ? '#B0BEC5' : '#666',
    inputBg: isDarkMode ? '#37474F' : '#f5f5f5',
    inputText: isDarkMode ? 'white' : 'black',
  };

  useEffect(() => {
    loadData();
    loadSuggestions();

    // Handle Hardware Back Button (Android)
    const backAction = () => {
      if (chatHistory.length > 0) {
        resetToHome();
        return true; // Prevent default behavior (exit)
      }
      return false; // Let default behavior happen (exit)
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => { 
        Speech.stop(); 
        if (sound) sound.unloadAsync(); 
        backHandler.remove();
    };
  }, [chatHistory]); // Re-bind listener when history changes

  // --- LOGIC: SUGGESTIONS ---
  const loadSuggestions = async () => {
      try {
          const idxStr = await AsyncStorage.getItem('suggestionIndex');
          let idx = parseInt(idxStr || '-1'); // Default to -1 so first run becomes 0
          
          // Increment index for THIS session
          let nextIdx = (idx + 1) % SUGGESTION_POOLS.length;
          
          setCurrentSuggestions(SUGGESTION_POOLS[nextIdx]);
          await AsyncStorage.setItem('suggestionIndex', nextIdx.toString());
      } catch (e) {
          setCurrentSuggestions(SUGGESTION_POOLS[0]);
      }
  };

  // --- LOGIC: RESET TO HOME ---
  const resetToHome = () => {
      // Trigger Animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setChatHistory([]); // Clear Chat
      setQuery('');
      Keyboard.dismiss();
  };

  // --- LOGIC: VOICE ---
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const recordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        };
        const { recording } = await Audio.Recording.createAsync(recordingOptions);
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert("Permission needed", "Please allow microphone access.");
      }
    } catch (err) { console.error('Failed to start recording', err); }
  }

  async function stopRecording() {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    handleAsk(null, uri);
  }

  // --- LOGIC: DATA & MUSIC ---
  const loadData = async () => {
    try {
        const savedStreak = await AsyncStorage.getItem('userStreak');
        const savedCount = await AsyncStorage.getItem('dailyCount');
        const savedWeekly = await AsyncStorage.getItem('weeklyStats');
        const lastDate = await AsyncStorage.getItem('lastOpenDate');
        const todayDate = new Date().toDateString();
        let currentWeekStats = savedWeekly ? JSON.parse(savedWeekly) : {};

        if (lastDate !== todayDate) {
            await AsyncStorage.setItem('dailyCount', '0');
            await AsyncStorage.setItem('lastOpenDate', todayDate);
            setDailyCount(0);
            if (savedStreak) {
                const newStreak = parseInt(savedStreak) + 1;
                setStreak(newStreak);
                await AsyncStorage.setItem('userStreak', newStreak.toString());
            } else {
                setStreak(1); await AsyncStorage.setItem('userStreak', '1');
            }
        } else {
            if (savedStreak) setStreak(parseInt(savedStreak));
            if (savedCount) setDailyCount(parseInt(savedCount));
        }
        setWeeklyStats(currentWeekStats);
    } catch (e) { console.log("Data Load Error", e); }
  };

  const incrementDailyGoal = async () => {
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      await AsyncStorage.setItem('dailyCount', newCount.toString());
      const todayDayName = DAYS_OF_WEEK[new Date().getDay()];
      const updatedStats = { ...weeklyStats, [todayDayName]: newCount };
      setWeeklyStats(updatedStats);
      await AsyncStorage.setItem('weeklyStats', JSON.stringify(updatedStats));
  };

  const toggleMusic = async () => {
    if (sound) { await sound.unloadAsync(); setSound(null); }
    let nextIndex = musicIndex + 1;
    if (nextIndex >= MUSIC_TRACKS.length) nextIndex = -1;
    setMusicIndex(nextIndex);
    if (nextIndex !== -1) {
        const { sound: newSound } = await Audio.Sound.createAsync(MUSIC_TRACKS[nextIndex].file, { shouldPlay: true, isLooping: true });
        setSound(newSound);
    }
  };

  // --- LOGIC: CHAT ---
  const handleAsk = async (textOverride = null, audioUri = null) => {
    const textToSearch = textOverride || query;
    if (!textToSearch.trim() && !audioUri) return;
    
    Keyboard.dismiss();
    Speech.stop();
    setSpeakingMsgId(null);
    incrementDailyGoal(); 

    // Animate New Message Entry
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const userMsg = { id: Date.now().toString(), role: 'user', text: audioUri ? "🎤 Voice Query" : textToSearch };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd(), 100);

    try {
      let payload = { history: chatHistory.slice(-6).map(m => ({ role: m.role, text: m.text })) };
      if (audioUri) {
          const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: 'base64' });
          payload.audio = base64Audio;
      } else {
          payload.query = userMsg.text;
      }

      const res = await axios.post(API_URL, payload, { timeout: 30000 });
      
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', text: res.data.answer, 
        sources: res.data.sources, isUnsafe: res.data.isUnsafe 
      };
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setChatHistory(prev => [...prev, aiMsg]);

      if (res.data.isUnsafe) {
        Speech.speak("Please be careful. Consult a doctor.", { language: 'en-US' });
      }

    } catch (error) {
      console.log("Full Error:", error);
      const errMsg = error.response ? JSON.stringify(error.response.data) : (error.request ? "Network Error" : error.message);
      Alert.alert("Error", errMsg);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    }
  };

  const toggleSpeech = (msgId, text) => {
    if (speakingMsgId === msgId) {
      Speech.stop(); setSpeakingMsgId(null);
    } else {
      Speech.stop(); setSpeakingMsgId(msgId);
      Speech.speak(text.replace(/[*#_`-]/g, ''), {
        onDone: () => setSpeakingMsgId(null), onStopped: () => setSpeakingMsgId(null)
      });
    }
  };

  const renderItem = ({ item }) => {
    if (item.role === 'user') {
      return (
        <View style={[styles.userBubble, { backgroundColor: theme.bubbleUser }]}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.aiBubble, { backgroundColor: theme.bubbleAI }]}>
        <View style={styles.botHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="leaf" size={12} color={theme.headerText} style={{marginRight:4}} />
                <Text style={[styles.botName, { color: theme.textSecondary }]}>YogiAI</Text>
            </View>
            {item.isUnsafe && <Text style={styles.unsafeBadge}>⚠️ Safety Warning</Text>}
        </View>
        <Markdown style={getMarkdownStyles(isDarkMode)}>{item.text}</Markdown>
        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => toggleSpeech(item.id, item.text)}>
                <Ionicons name={speakingMsgId === item.id ? "stop-circle" : "volume-high"} size={18} color={theme.headerText} />
                <Text style={[styles.actionText, { color: theme.headerText }]}>Listen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { marginLeft: 10 }]} onPress={() => Share.share({ message: item.text })}>
                <Ionicons name="share-social" size={18} color={theme.headerText} />
                <Text style={[styles.actionText, { color: theme.headerText }]}>Share</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.bgColors} style={styles.safeAreaContainer}>
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, width: '100%' }}>
        
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
            {/* CLICKABLE LOGO -> RESET TO HOME */}
            <TouchableOpacity onPress={resetToHome} style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="leaf" size={24} color={theme.headerText} />
                <Text style={[styles.headerTitle, { color: theme.headerText }]}> YogiAI</Text>
            </TouchableOpacity>
            
            <View style={styles.headerControls}>
                <TouchableOpacity onPress={() => setStreakModalVisible(true)} style={styles.streakBadge}>
                    <Ionicons name="flame" size={18} color="#FF5722" />
                    <Text style={styles.streakText}>{streak}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMusic} style={styles.iconButton}>
                    <Ionicons name={musicIndex === -1 ? "musical-notes-outline" : "musical-notes"} size={24} color={musicIndex === -1 ? theme.textSecondary : "#E91E63"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={24} color={theme.headerText} />
                </TouchableOpacity>
            </View>
        </View>

        {/* CHAT LIST */}
        <FlatList
            ref={listRef}
            data={chatHistory}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            style={{flex: 1, width: '100%'}} 
            ListFooterComponent={loading ? <SkeletonLoader theme={theme} /> : null}
            ListEmptyComponent={
                !loading && (
                    <View style={styles.emptyContainer}>
                        <LottieView autoPlay style={{ width: 180, height: 180 }} source={require('./assets/meditation.json')} />
                        <Text style={[styles.emptyText, { color: theme.headerText }]}>Namaste 🙏</Text>
                        
                        {/* DYNAMIC ROTATING SUGGESTIONS */}
                        {currentSuggestions.map((sug, i) => (
                            <TouchableOpacity key={i} onPress={() => handleAsk(sug)} style={[styles.suggestionButton, { borderColor: theme.textSecondary }]}>
                                <Text style={[styles.suggestionText, { color: theme.headerText }]}>{sug}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )
            }
        />

        {/* INPUT */}
        <View style={[styles.inputWrapper, { backgroundColor: theme.headerBg }]}>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.inputText }]} 
            placeholder={isRecording ? "Listening..." : "Type or speak..."}
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            editable={!isRecording}
          />
          <TouchableOpacity style={[styles.micButton, isRecording && styles.micButtonActive]} onPress={isRecording ? stopRecording : startRecording}>
             <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
          </TouchableOpacity>
          {!isRecording && (
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.headerText }]} onPress={() => handleAsk()} disabled={loading}>
                 <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
          )}
        </View>
      
      </KeyboardAvoidingView>
      <View style={{ height: 20, backgroundColor: theme.headerBg }} />

      {/* MODALS */}
      <Modal visible={streakModalVisible} animationType="fade" transparent={true} onRequestClose={() => setStreakModalVisible(false)}>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#1f2937' : 'white' }]}>
                <Text style={[styles.modalTitle, { color: '#FF5722' }]}>🔥 Weekly Progress</Text>
                <Text style={[styles.streakBigNumber, { color: theme.headerText }]}>{streak} Day Streak!</Text>
                <View style={styles.graphContainer}>
                    {DAYS_OF_WEEK.map((day) => {
                        const count = weeklyStats[day] || 0;
                        const fillHeight = Math.min((count / 10) * 100, 100); 
                        const isToday = DAYS_OF_WEEK[new Date().getDay()] === day;
                        return (
                            <View key={day} style={styles.barWrapper}>
                                <View style={[styles.barBackground, { backgroundColor: isDarkMode ? '#37474F' : '#eee' }]}>
                                    <View style={[styles.barFill, { height: `${fillHeight}%`, backgroundColor: isToday ? '#FF5722' : theme.headerText }]} />
                                </View>
                                <Text style={[styles.dayLabel, { color: isToday ? '#FF5722' : theme.textSecondary }]}>{day}</Text>
                            </View>
                        );
                    })}
                </View>
                <Text style={[styles.modalLabel, {marginTop: 15}]}>Today: {dailyCount}/10 Queries</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setStreakModalVisible(false)}><Text style={[styles.closeButtonText, { color: theme.headerText }]}>Close</Text></TouchableOpacity>
            </View>
         </View>
      </Modal>

      <Modal visible={settingsModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSettingsModalVisible(false)}>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#1f2937' : 'white' }]}>
                <Text style={[styles.modalTitle, { color: theme.headerText }]}>⚙️ Settings</Text>
                <View style={styles.settingRow}>
                    <Text style={[styles.settingText, { color: theme.textPrimary }]}>Dark Mode</Text>
                    <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{false: "#767577", true: "#a8e063"}} thumbColor={isDarkMode ? "#2d6a4f" : "#f4f3f4"} />
                </View>
                <View style={styles.divider} />
                <Text style={[styles.modalTitle, { color: theme.headerText, fontSize: 18, marginTop: 10 }]}>🌿 About YogiAI</Text>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>An AI-powered Yoga Assistant built with React Native & Gemini.</Text>
                <Text style={styles.modalLabel}>Developer:</Text>
                <Text style={[styles.modalValue, { color: theme.textPrimary }]}>SPDwivedi</Text>
                <TouchableOpacity style={[styles.linkButton, {backgroundColor: '#333'}]} onPress={() => Linking.openURL('https://github.com/spdwivedi/Wellness_RAG_Micro-App')}>
                    <Ionicons name="logo-github" size={20} color="white" />
                    <Text style={styles.linkText}> View Source Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSettingsModalVisible(false)}><Text style={[styles.closeButtonText, { color: theme.headerText }]}>Close</Text></TouchableOpacity>
            </View>
         </View>
      </Modal>

    </LinearGradient>
  );
}

// STYLES
const getMarkdownStyles = (isDark) => ({
  body: { fontSize: 16, color: isDark ? '#E0E0E0' : '#333' },
  heading3: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#a8e063' : '#2d6a4f', marginTop: 10 },
  strong: { fontWeight: 'bold', color: isDark ? '#a8e063' : '#2d6a4f' }
});

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1, width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { fontSize: 24, fontWeight: '800', marginLeft: 5 },
  headerControls: { flexDirection: 'row', alignItems: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 87, 34, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  streakText: { fontWeight: 'bold', color: '#FF5722', marginLeft: 4 },
  iconButton: { marginLeft: 12 },
  listContent: { padding: 15, paddingBottom: 20, width: '100%' },
  userBubble: { alignSelf: 'flex-end', padding: 12, borderRadius: 20, marginBottom: 15, maxWidth: '80%' },
  userText: { color: 'white', fontSize: 16 },
  aiBubble: { alignSelf: 'flex-start', padding: 15, borderRadius: 20, marginBottom: 15, maxWidth: '90%', elevation: 2 },
  botHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  botName: { fontWeight: 'bold', fontSize: 12 },
  unsafeBadge: { color: 'red', fontSize: 10, fontWeight: 'bold', backgroundColor: '#ffe5e5', padding: 2, borderRadius: 4 },
  actionRow: { flexDirection: 'row', marginTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 20, paddingHorizontal: 12 },
  actionText: { marginLeft: 5, fontWeight: 'bold', fontSize: 13 },
  inputWrapper: { flexDirection: 'row', padding: 15, width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  input: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, fontSize: 16, marginRight: 10 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  micButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  micButtonActive: { backgroundColor: 'red' },
  emptyContainer: { alignItems: 'center', marginTop: 30, opacity: 0.9, width: '100%' },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 20 },
  suggestionButton: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginBottom: 10, borderWidth: 1 },
  suggestionText: { fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { margin: 20, borderRadius: 20, padding: 30, alignItems: "center", elevation: 5, width: '85%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  streakBigNumber: { fontSize: 32, fontWeight: '800' },
  graphContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', height: 120, marginTop: 10 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barBackground: { width: 10, height: 100, borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 5 },
  dayLabel: { marginTop: 5, fontSize: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
  settingText: { fontSize: 16, fontWeight: '600' },
  linkButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, width: '100%', justifyContent: 'center', marginBottom: 10 },
  linkText: { color: "white", fontWeight: "bold", marginLeft: 8 },
  modalLabel: { fontSize: 14, color: '#999', marginBottom: 5 },
  modalValue: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  modalText: { textAlign: "center", fontSize: 15, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#eee', width: '100%', marginVertical: 15 },
  closeButton: { marginTop: 20, padding: 10 },
  closeButtonText: { fontWeight: 'bold', fontSize: 16 }
});