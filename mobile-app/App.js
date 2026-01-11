import Markdown from 'react-native-markdown-display';
import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, Modal, Image, Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import * as Speech from 'expo-speech'; 
import axios from 'axios';
import LottieView from 'lottie-react-native'; 
import { Ionicons } from '@expo/vector-icons'; // For Icons

export default function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // --- NEW: Modal State

  // REPLACE WITH YOUR RENDER URL
  const API_URL = 'https://wellness-rag-micro-app.onrender.com/ask';

  const animation = useRef(null);

  // --- NEW HELPER FUNCTION TO CLEAN TEXT FOR SPEECH ---
  const cleanTextForSpeech = (text) => {
    if (!text) return "";
    return text
      .replace(/###/g, '')       // Remove headings
      .replace(/\*\*/g, '')      // Remove bold markers
      .replace(/\*/g, '')        // Remove bullet points
      .replace(/-/g, '')         // Remove dashes
      .replace(/`/g, '')         // Remove code ticks
      .replace(/\n/g, '. ');     // Turn new lines into pauses
  };

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await axios.post(API_URL, { query });
      setResponse(res.data);
      if (res.data.isUnsafe) {
        const safeText = cleanTextForSpeech(res.data.answer.substring(0, 100));
        Speech.speak("Please be careful. " + safeText); 
      }
    } catch (error) {
      Alert.alert("Error", "YogiAI is meditating. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const speakAnswer = () => {
    if (response?.answer) {
      const spokenText = cleanTextForSpeech(response.answer);
      Speech.speak(spokenText);
    }
  };

  // --- NEW: Function to open links
  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient colors={['#a8e063', '#56ab2f']} style={styles.container}>
      <View style={styles.glassContainer}>
        
        {/* --- NEW: Header with Info Icon --- */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>🌿 YogiAI</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={28} color="#2d6a4f" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask about a pose or pain..." 
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery} 
          />
        </View>

        <TouchableOpacity style={styles.askButton} onPress={handleAsk} disabled={loading}>
          {/* --- NEW: Lottie Animation Logic --- */}
          {loading ? (
            <View style={{ height: 50, width: 50 }}>
             {/* ENSURE YOU HAVE A FILE NAMED 'meditation.json' IN ASSETS */}
              <LottieView
                autoPlay
                ref={animation}
                style={{ width: 50, height: 50 }}
                // If you don't have a file yet, this source is a placeholder. 
                source={require('./assets/meditation.json')} 
              />
            </View>
          ) : (
            <Text style={styles.buttonText}>Ask YogiAI</Text>
          )}
        </TouchableOpacity>

        <ScrollView style={styles.scrollArea} contentContainerStyle={{paddingBottom: 20}}>
          {response && (
            <View style={styles.resultCard}>
              {response.isUnsafe && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>⚠️ Gentle Warning: Medical Guidance Recommended</Text>
                </View>
              )}

              <Text style={styles.answerTitle}>Namaste 🙏</Text>

              <View style={{ paddingHorizontal: 5 }}>
                <Markdown style={markdownStyles}>
                  {response.answer}
                </Markdown>
              </View>

              <TouchableOpacity style={styles.speakButton} onPress={speakAnswer}>
                 <Text style={styles.speakText}>🔊 Listen</Text>
              </TouchableOpacity>

              <View style={styles.divider} />
              <Text style={styles.sourceTitle}>Wisdom Sources:</Text>
              {response.sources.map((src, i) => (
                <Text key={i} style={styles.sourceText}>📚 {src.title}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* --- NEW: About Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>About YogiAI</Text>
            <Text style={styles.modalText}>
              Built with 💚 by SPDwivedi
            </Text>
            <Text style={styles.modalSubText}>
              Powered by Google Gemini & React Native
            </Text>

            <TouchableOpacity 
              style={[styles.linkButton, { backgroundColor: '#333' }]} 
              onPress={() => openLink('https://github.com/spdwivedi/Wellness_RAG_Micro-App')}
            >
              <Ionicons name="logo-github" size={20} color="white" style={{marginRight: 10}}/>
              <Text style={styles.linkText}>View Code on GitHub</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkButton, { backgroundColor: '#FF0000' }]} 
              onPress={() => openLink('https://youtu.be/YOUR_VIDEO_ID')}
            >
              <Ionicons name="logo-youtube" size={20} color="white" style={{marginRight: 10}}/>
              <Text style={styles.linkText}>Watch Demo Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

// --- STYLES ---
const markdownStyles = {
  body: { fontSize: 16, color: '#333', lineHeight: 24 },
  heading1: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f', marginTop: 10, marginBottom: 10 },
  heading2: { fontSize: 20, fontWeight: 'bold', color: '#2d6a4f', marginTop: 10, marginBottom: 5 },
  heading3: { fontSize: 18, fontWeight: 'bold', color: '#2d6a4f', marginTop: 10, marginBottom: 5 },
  bullet_list: { marginBottom: 10 },
  list_item: { marginBottom: 5, fontSize: 16, flexDirection: 'row', alignItems: 'flex-start'},
  strong: { fontWeight: 'bold', color: '#2d6a4f' }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  glassContainer: { 
    flex: 1, marginTop: 60, backgroundColor: 'rgba(255,255,255,0.85)', 
    borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
  header: { fontSize: 32, fontWeight: '800', color: '#2d6a4f', textAlign: 'center' },
  infoButton: { position: 'absolute', right: 0, padding: 5 }, // Info icon placement
  inputContainer: { marginBottom: 15 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 15, fontSize: 16, elevation: 2 },
  askButton: { 
    backgroundColor: '#2d6a4f', padding: 16, borderRadius: 15, alignItems: 'center', marginBottom: 20, height: 60, justifyContent: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  scrollArea: { flex: 1 },
  resultCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 3 },
  warningBanner: { backgroundColor: '#ffe5e5', padding: 10, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ff4d4d' },
  warningText: { color: '#cc0000', fontWeight: 'bold' },
  answerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 10 },
  speakButton: { marginTop: 15, alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: 8, borderRadius: 20, paddingHorizontal: 15 },
  speakText: { color: '#2d6a4f', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sourceTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  sourceText: { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 3 },
  
  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%' },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 15, color: "#2d6a4f" },
  modalText: { marginBottom: 10, textAlign: "center", fontSize: 16, fontWeight: 'bold' },
  modalSubText: { marginBottom: 20, textAlign: "center", fontSize: 14, color: '#666' },
  linkButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, width: '100%', justifyContent: 'center', marginBottom: 10 },
  linkText: { color: "white", fontWeight: "bold", textAlign: "center" },
  closeButton: { marginTop: 10, padding: 10 },
  closeButtonText: { color: "#2d6a4f", fontWeight: "bold", fontSize: 16 }
});