import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS, SIZES } from './src/assets/theme';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TreinosScreen from './src/screens/TreinosScreen';
import ConquistasScreen from './src/screens/ConquistasScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import ExecucaoTreinoScreen from './src/screens/ExecucaoTreinoScreen';

export default function App() {
  const [screenState, setScreenState] = useState('Login'); // 'Login' ou 'App'
  const [currentTab, setCurrentTab] = useState('Inicio');
  const [treinoSelecionado, setTreinoSelecionado] = useState(null);
  const [fontScale, setFontScale] = useState(1.0);
  const [isVoiceOn, setIsVoiceOn] = useState(true);

  // Perfil clínico estático para o uso da IA do VitAju
  const [userProfile, setUserProfile] = useState({
    nome: "Maria Silva",
    idade: 58,
    peso: 72,
    altura: 1.65,
    nivelAtividade: "Iniciante",
    limitacoes: "Leve desgaste no joelho direito e hipertensão controlada"
  });

  const falar = (texto) => {
    if (isVoiceOn) {
      Speech.stop();
      Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });
    }
  };

  const renderAccessibilityBar = () => (
    <View style={styles.accessibilityHeader}>
      <View style={styles.fontSizeControls}>
        <Text style={[styles.accessibilityText, { fontSize: SIZES.getFont(11) * fontScale }]}>FONTE</Text>
        <TouchableOpacity style={[styles.fontBtn, fontScale === 1.0 && styles.activeFontBtn]} onPress={() => setFontScale(1.0)}>
          <Text style={styles.fontBtnText}>A</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fontBtn, fontScale === 1.25 && styles.activeFontBtn]} onPress={() => setFontScale(1.25)}>
          <Text style={styles.fontBtnText}>A+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.voiceBtn, !isVoiceOn && { backgroundColor: '#3A1C1C' }]} onPress={() => setIsVoiceOn(!isVoiceOn)}>
        <Text style={[styles.voiceBtnText, !isVoiceOn && { color: '#FF4D4D' }]}>{isVoiceOn ? '🔊 Voz on' : '🔇 Voz off'}</Text>
      </TouchableOpacity>
    </View>
  );

  // Gerenciamento de Fluxo Deslogado (Apenas Login)
  if (screenState === 'Login') {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <LoginScreen 
          onLogin={() => setScreenState('App')} 
          onIrParaCadastro={() => {}} // Função desativada para remover o fluxo de cadastro
          fontScale={fontScale} setFontScale={setFontScale}
          isVoiceOn={isVoiceOn} setIsVoiceOn={setIsVoiceOn} falar={falar}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} translucent={true} />
      {renderAccessibilityBar()}
      
      <View style={styles.mainContent}>
        {treinoSelecionado ? (
          <ExecucaoTreinoScreen treino={treinoSelecionado} fontScale={fontScale} falar={falar} aoVoltar={() => setTreinoSelecionado(null)} />
        ) : (
          currentTab === 'Inicio' ? <HomeScreen fontScale={fontScale} falar={falar} userProfile={userProfile} /> :
          currentTab === 'Treinos' ? <TreinosScreen fontScale={fontScale} falar={falar} userProfile={userProfile} aoSelecionarTreino={(t) => setTreinoSelecionado(t)} /> :
          currentTab === 'Conquistas' ? <ConquistasScreen fontScale={fontScale} /> :
          <PerfilScreen fontScale={fontScale} userProfile={userProfile} onLogout={() => { setScreenState('Login'); setCurrentTab('Inicio'); }} />
        )}
      </View>

      {!treinoSelecionado && (
        <View style={styles.tabBarContainer}>
          <SafeAreaView style={styles.tabBar}>
            {['Inicio', 'Treinos', 'Conquistas', 'Perfil'].map((tab) => (
              <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setCurrentTab(tab)}>
                <Text style={[styles.tabIcon, currentTab === tab && styles.activeText]}>
                  {tab === 'Inicio' ? '🏠' : tab === 'Treinos' ? '📋' : tab === 'Conquistas' ? '🏅' : '👤'}
                </Text>
                <Text style={[styles.tabLabel, currentTab === tab && styles.activeText, { fontSize: SIZES.getFont(10) * fontScale }]}>
                  {tab === 'Inicio' ? 'Início' : tab === 'Treinos' ? 'Treinos' : tab === 'Conquistas' ? 'Conquistas' : 'Perfil'}
                </Text>
              </TouchableOpacity>
            ))}
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12 },
  mainContent: { flex: 1 },
  accessibilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: COLORS.background },
  fontSizeControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accessibilityText: { color: '#FFFFFF', fontWeight: 'bold' },
  fontBtn: { backgroundColor: COLORS.surface, width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeFontBtn: { backgroundColor: COLORS.primary },
  fontBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  voiceBtn: { backgroundColor: '#1C3A27', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  voiceBtnText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 12 },
  tabBarContainer: { backgroundColor: '#17132B', borderTopWidth: 1, borderTopColor: '#251F47', paddingBottom: Platform.OS === 'android' ? 24 : 0 },
  tabBar: { flexDirection: 'row', paddingVertical: 6 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  tabIcon: { fontSize: 20, color: '#A09CB3' },
  tabLabel: { color: '#A09CB3', marginTop: 2, fontWeight: '600' },
  activeText: { color: COLORS.accent }
});
