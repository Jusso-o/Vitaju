import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import PoseCapture from './src/PoseCapture';
import { saveExerciseSession } from './src/api/sessionService';

const colors = {
  background: '#10151D',
  surface: '#19212C',
  surfaceLight: '#222D39',
  border: '#303D49',
  text: '#F4F7F2',
  muted: '#AFBBC2',
  green: '#B9E58A',
  greenDark: '#253A2B',
  blue: '#A8D9E8',
  amber: '#F2D59A',
};

const exercises = [
  {
    id: 'bracos',
    name: 'Mobilidade dos braços',
    detail: 'Movimentos leves para ombros e braços',
    duration: '5 min',
    position: 'Sentado ou em pé',
    icon: '🙆',
    steps: [
      'Sente-se com os pés apoiados ou fique em pé com uma postura confortável.',
      'Eleve os braços devagar somente até onde for confortável.',
      'Faça uma pausa e retorne os braços lentamente.',
    ],
  },
  {
    id: 'marcha',
    name: 'Marcha sentada',
    detail: 'Alternância suave das pernas',
    duration: '5 min',
    position: 'Sentado',
    icon: '🪑',
    steps: [
      'Sente-se em uma cadeira firme, com os pés apoiados no chão.',
      'Eleve um pé alguns centímetros, sem pressa, e devolva-o ao chão.',
      'Alterne as pernas em um ritmo confortável.',
    ],
  },
  {
    id: 'calcanhares',
    name: 'Elevação de calcanhares',
    detail: 'Movimento com apoio estável por perto',
    duration: '5 min',
    position: 'Em pé, com apoio',
    icon: '🦶',
    steps: [
      'Fique perto de uma cadeira firme ou bancada para ter apoio.',
      'Se estiver confortável, eleve os calcanhares devagar.',
      'Abaixe os pés lentamente e faça uma pausa.',
    ],
  },
];

const tabs = [
  { id: 'inicio', label: 'Início', icon: '⌂' },
  { id: 'treinos', label: 'Exercícios', icon: '◉' },
  { id: 'camera', label: 'Câmera', icon: '◎' },
  { id: 'conquistas', label: 'Progresso', icon: '☆' },
  { id: 'perfil', label: 'Perfil', icon: '○' },
];

function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [fontScale, setFontScale] = useState(1);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [movementCount, setMovementCount] = useState(0);
  const [detectedFrames, setDetectedFrames] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const savingSessionRef = useRef(false);
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (activeTab !== 'camera') {
      setCameraActive(false);
    }
  }, [activeTab]);

  const speak = (message) => {
    if (!voiceEnabled) return;
    Speech.stop();
    Speech.speak(message, { language: 'pt-BR', rate: 0.9 });
  };

  const changeTab = (tab) => {
    setNotice('');
    setActiveTab(tab);
  };

  const openExercise = (exercise) => {
    setSelectedExercise(exercise);
    setNotice('');
    setActiveTab('camera');
  };

  const enableCamera = () => {
    setMovementCount(0);
    setDetectedFrames(0);
    setSessionStartedAt(new Date().toISOString());
    setNotice('');
    setCameraActive(true);
  };

  const updatePoseMetrics = useCallback(({ movementCount: movements, detectedFrames: frames }) => {
    setMovementCount(movements);
    setDetectedFrames(frames);
  }, []);

  const saveSession = async (session) => {
    if (savingSessionRef.current) return;
    savingSessionRef.current = true;
    setIsSavingSession(true);
    try {
      await saveExerciseSession(session);
      setCompletedSessions((count) => count + 1);
      setPendingSession(null);
      setNotice(`Sessão salva. Movimentos registrados: ${session.movementCount}.`);
    } catch (error) {
      setPendingSession(session);
      Alert.alert(
        'Sessão encerrada, mas não salva',
        `${error.message}\n\nInicie o backend e tente salvar novamente.`,
      );
    } finally {
      savingSessionRef.current = false;
      setIsSavingSession(false);
    }
  };

  const finishSession = async () => {
    if (!sessionStartedAt || savingSessionRef.current) return;

    const finishedSession = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      movementCount,
      detectedFrames,
      durationSeconds: Math.max(
        1,
        Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000),
      ),
      startedAt: sessionStartedAt,
    };

    setCameraActive(false);
    setSessionStartedAt(null);
    setPendingSession(finishedSession);
    await saveSession(finishedSession);
  };

  const shareProgress = async () => {
    try {
      await Share.share({
        message: `Estou seguindo meu ritmo com o Vitaju. Já registrei ${completedSessions} sessão(ões) de demonstração!`,
      });
    } catch (error) {
      Alert.alert('Não foi possível compartilhar', error.message);
    }
  };

  const Txt = ({ children, size = 15, bold = false, muted = false, style, ...props }) => (
    <Text
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.text,
          fontSize: size * fontScale,
          fontWeight: bold ? '700' : '400',
          lineHeight: size * fontScale * 1.4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );

  const Button = ({ children, onPress, secondary = false, disabled = false, style }) => (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.78}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      <Txt size={16} bold style={secondary ? styles.secondaryButtonText : styles.buttonText}>
        {children}
      </Txt>
    </TouchableOpacity>
  );

  const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Txt size={21} bold style={styles.brandLetter}>V</Txt>
        </View>
        <View>
          <Txt size={20} bold>Vitaju</Txt>
          <Txt size={10} muted style={styles.brandSubtitle}>MOVIMENTO E BEM-ESTAR</Txt>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Diminuir tamanho do texto"
          onPress={() => setFontScale((scale) => Math.max(0.9, Number((scale - 0.1).toFixed(1))))}
          style={styles.headerButton}
        >
          <Txt size={15} bold>A−</Txt>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Aumentar tamanho do texto"
          onPress={() => setFontScale((scale) => Math.min(1.5, Number((scale + 0.1).toFixed(1))))}
          style={styles.headerButton}
        >
          <Txt size={15} bold>A+</Txt>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={voiceEnabled ? 'Desativar leitura em voz alta' : 'Ativar leitura em voz alta'}
          onPress={() => setVoiceEnabled((enabled) => !enabled)}
          style={styles.headerButton}
        >
          <Txt size={17}>{voiceEnabled ? '◖' : '♪'}</Txt>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHome = () => (
    <>
      <Txt size={15} muted>Olá{profileName.trim() ? `, ${profileName.trim()}` : ''}.</Txt>
      <Txt size={30} bold style={styles.pageTitle}>Seu movimento,{"\n"}no seu ritmo.</Txt>
      <Txt size={16} muted>
        Encontre exercícios leves e acompanhe seu progresso com tranquilidade.
      </Txt>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Txt size={27}>🌿</Txt></View>
          <View style={styles.heroTag}><Txt size={11} bold style={styles.heroTagText}>PARA COMEÇAR</Txt></View>
        </View>
        <Txt size={23} bold>Uma pausa para você</Txt>
        <Txt size={15} muted>
          Escolha uma atividade simples e faça somente o que for confortável.
        </Txt>
        <Button onPress={() => openExercise(exercises[0])}>Ver exercício sugerido</Button>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Txt size={27} bold style={styles.statNumber}>{completedSessions}</Txt>
          <Txt size={13} muted>Sessões registradas</Txt>
        </Card>
        <Card style={styles.statCard}>
          <Txt size={27} bold style={styles.statNumber}>{completedSessions * 20}</Txt>
          <Txt size={13} muted>Pontos de demonstração</Txt>
        </Card>
      </View>

      <View style={styles.sectionHeading}>
        <Txt size={20} bold>Exercícios para explorar</Txt>
        <TouchableOpacity onPress={() => changeTab('treinos')}>
          <Txt size={14} bold style={styles.linkText}>Ver todos</Txt>
        </TouchableOpacity>
      </View>
      {exercises.slice(0, 2).map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} onPress={() => openExercise(exercise)} Txt={Txt} />
      ))}
      <SafetyNote Txt={Txt} />
    </>
  );

  const renderExercises = () => (
    <>
      <Txt size={13} bold style={styles.eyebrow}>NO SEU RITMO</Txt>
      <Txt size={28} bold style={styles.pageTitle}>Escolha um exercício</Txt>
      <Txt size={16} muted>
        Atividades leves para experimentar. Toque em uma delas para abrir a prévia da câmera.
      </Txt>
      <Card style={styles.recommendationCard}>
        <Txt size={16} bold style={styles.recommendationTitle}>Sugestão inicial</Txt>
        <Txt size={14} muted>
          Comece pela mobilidade dos braços, que também pode ser feita sentado. A seleção é fixa neste protótipo, não é uma recomendação de IA.
        </Txt>
      </Card>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} onPress={() => openExercise(exercise)} Txt={Txt} />
      ))}
      <SafetyNote Txt={Txt} />
    </>
  );

  const renderCamera = () => (
    <>
      <Txt size={13} bold style={styles.eyebrow}>ATIVIDADE SELECIONADA</Txt>
      <Txt size={28} bold style={styles.pageTitle}>Vamos com calma</Txt>
      <Card style={styles.selectedCard}>
        <View style={styles.selectedIcon}><Txt size={27}>{selectedExercise.icon}</Txt></View>
        <View style={styles.selectedText}>
          <Txt size={18} bold>{selectedExercise.name}</Txt>
          <Txt size={14} muted>{selectedExercise.position} · {selectedExercise.duration}</Txt>
        </View>
      </Card>

      <View style={styles.cameraFrame}>
        {cameraActive ? (
          <PoseCapture
            onMetricsChange={updatePoseMetrics}
            renderText={Txt}
            trackArmRaises={selectedExercise.id === 'bracos'}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <View style={styles.cameraIcon}><Txt size={30}>◎</Txt></View>
            <Txt size={17} bold>A captura de movimento aparecerá aqui</Txt>
            <Txt size={14} muted style={styles.centeredText}>
              A análise acontece no aparelho. Nenhuma imagem ou vídeo é enviado ao servidor.
            </Txt>
          </View>
        )}
      </View>

      <Card style={styles.noticeCard}>
        <Txt size={15} bold style={styles.noticeTitle}>Captura de movimento</Txt>
        <Txt size={14} muted>
          O MediaPipe localiza pontos do corpo. A contagem experimental de elevações dos braços está disponível no exercício Mobilidade dos braços; não avalia postura clínica nem confirma se o exercício é seguro para você.
        </Txt>
        <Txt size={14} bold style={styles.noticeTitle}>Movimentos detectados: {movementCount}</Txt>
        <Txt size={12} muted>Quadros com pose identificada: {detectedFrames}</Txt>
      </Card>

      <Card style={styles.stepsCard}>
        <Txt size={17} bold>Orientações do exercício</Txt>
        {selectedExercise.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Txt size={13} bold style={styles.stepNumberText}>{index + 1}</Txt>
            </View>
            <Txt size={14} muted style={styles.stepText}>{step}</Txt>
          </View>
        ))}
      </Card>

      {notice ? (
        <Card style={styles.successCard}>
          <Txt size={14} bold style={styles.successText}>{notice}</Txt>
        </Card>
      ) : null}
      {!cameraActive && pendingSession ? (
        <Button
          disabled={isSavingSession}
          onPress={() => saveSession(pendingSession)}
        >
          {isSavingSession ? 'Salvando sessão...' : 'Tentar salvar sessão novamente'}
        </Button>
      ) : !cameraActive ? (
        <Button onPress={enableCamera}>Iniciar captura de movimento</Button>
      ) : (
        <Button disabled={isSavingSession} onPress={finishSession}>
          {isSavingSession ? 'Salvando sessão...' : 'Concluir e salvar sessão'}
        </Button>
      )}
      <Txt size={12} muted style={styles.disclaimer}>
        O vídeo não sai do aparelho. A sessão salva no backend contém apenas exercício, tempo, quadros detectados e contagem experimental.
      </Txt>
      <SafetyNote Txt={Txt} />
    </>
  );

  const renderProgress = () => (
    <>
      <Txt size={13} bold style={styles.eyebrow}>SEU CAMINHO</Txt>
      <Txt size={28} bold style={styles.pageTitle}>Progresso e conquistas</Txt>
      <Txt size={16} muted>
        Um registro simples para celebrar cada passo no seu ritmo.
      </Txt>
      <Card style={styles.progressCard}>
        <Txt size={16} muted>Sessões registradas neste aparelho</Txt>
        <Txt size={42} bold style={styles.statNumber}>{completedSessions}</Txt>
        <Txt size={15} muted>Pontos de demonstração: {completedSessions * 20}</Txt>
      </Card>
      {notice ? (
        <Card style={styles.successCard}>
          <Txt size={14} bold style={styles.successText}>{notice}</Txt>
        </Card>
      ) : null}
      <Button secondary onPress={shareProgress}>Compartilhar meu progresso</Button>
      <Txt size={19} bold style={styles.subheading}>Conquistas</Txt>
      <Card style={styles.achievementCard}>
        <View style={styles.achievementIcon}><Txt size={22}>🌱</Txt></View>
        <View style={styles.achievementText}>
          <Txt size={16} bold>Primeiro passo</Txt>
          <Txt size={13} muted>Registre uma sessão de demonstração.</Txt>
        </View>
        <Txt size={14} bold style={completedSessions > 0 ? styles.earnedText : styles.pendingText}>
          {completedSessions > 0 ? 'Conquistada' : 'Pendente'}
        </Txt>
      </Card>
      <Card style={styles.achievementCard}>
        <View style={styles.achievementIcon}><Txt size={22}>⭐</Txt></View>
        <View style={styles.achievementText}>
          <Txt size={16} bold>Constância</Txt>
          <Txt size={13} muted>Registre três sessões.</Txt>
        </View>
        <Txt size={14} bold style={completedSessions >= 3 ? styles.earnedText : styles.pendingText}>
          {completedSessions >= 3 ? 'Conquistada' : 'Pendente'}
        </Txt>
      </Card>
      <Txt size={12} muted style={styles.disclaimer}>
        Os dados e pontos são temporários e ficam somente na memória durante esta demonstração.
      </Txt>
    </>
  );

  const renderProfile = () => (
    <>
      <Txt size={13} bold style={styles.eyebrow}>PREFERÊNCIAS</Txt>
      <Txt size={28} bold style={styles.pageTitle}>Seu perfil</Txt>
      <Txt size={15} muted>
        Ajuste como o app se dirige a você. Não é necessário informar dados de saúde.
      </Txt>
      <Card style={styles.profileCard}>
        <Txt size={15} bold style={styles.inputLabel}>Como podemos chamar você?</Txt>
        <TextInput
          accessibilityLabel="Nome de exibição"
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Seu nome"
          placeholderTextColor={colors.muted}
          style={[styles.input, { fontSize: 16 * fontScale }]}
          maxLength={40}
        />
        <Txt size={15} bold style={styles.inputLabel}>Idade (opcional)</Txt>
        <TextInput
          accessibilityLabel="Idade"
          value={profileAge}
          onChangeText={(value) => setProfileAge(value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="Ex.: 58"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={[styles.input, styles.ageInput, { fontSize: 16 * fontScale }]}
          maxLength={3}
        />
        <Button onPress={() => setNotice('Preferências atualizadas para esta sessão.')}>Salvar preferências</Button>
      </Card>
      {notice ? (
        <Card style={styles.successCard}>
          <Txt size={14} bold style={styles.successText}>{notice}</Txt>
        </Card>
      ) : null}
      <Card style={styles.noticeCard}>
        <Txt size={15} bold style={styles.noticeTitle}>Protótipo local</Txt>
        <Txt size={14} muted>
          Ainda não há cadastro, login, servidor ou banco de dados conectado. O nome, a idade e o progresso não são enviados nem ficam salvos depois que o app é fechado.
        </Txt>
      </Card>
      <Button
        secondary
        onPress={() => {
          setCompletedSessions(0);
          setNotice('O progresso de demonstração foi reiniciado.');
        }}
      >
        Reiniciar progresso de demonstração
      </Button>
    </>
  );

  const screens = {
    inicio: renderHome,
    treinos: renderExercises,
    camera: renderCamera,
    conquistas: renderProgress,
    perfil: renderProfile,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={colors.background} />
      {renderHeader()}
      <ScrollView
        key={activeTab}
        contentContainerStyle={styles.content}
        removeClippedSubviews={activeTab !== 'camera'}
        showsVerticalScrollIndicator={false}
      >
        {screens[activeTab]()}
      </ScrollView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
              onPress={() => changeTab(tab.id)}
              style={styles.tab}
            >
              <Txt size={21} bold style={selected ? styles.selectedTabText : styles.unselectedTabText}>
                {tab.icon}
              </Txt>
              <Txt size={10} bold style={selected ? styles.selectedTabText : styles.unselectedTabText}>
                {tab.label}
              </Txt>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function ExerciseCard({ exercise, onPress, Txt }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.78} onPress={onPress}>
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseIcon}><Txt size={24}>{exercise.icon}</Txt></View>
        <View style={styles.exerciseInfo}>
          <Txt size={16} bold>{exercise.name}</Txt>
          <Txt size={13} muted>{exercise.detail}</Txt>
          <Txt size={12} bold style={styles.exerciseMeta}>
            {exercise.position} · {exercise.duration}
          </Txt>
        </View>
        <Txt size={23} bold style={styles.chevron}>›</Txt>
      </View>
    </TouchableOpacity>
  );
}

function SafetyNote({ Txt }) {
  return (
    <View style={styles.safetyNote}>
      <Txt size={17}>ℹ</Txt>
      <Txt size={12} muted style={styles.safetyText}>
        Pare se sentir dor, tontura ou falta de ar. As sugestões são informativas e não substituem a orientação de um profissional de saúde.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: colors.background,
  },
  brandSubtitle: {
    letterSpacing: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 7,
  },
  headerButton: {
    width: 39,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 28,
    gap: 14,
  },
  pageTitle: {
    marginTop: 3,
    letterSpacing: -0.5,
  },
  eyebrow: {
    color: colors.green,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 17,
    gap: 10,
  },
  heroCard: {
    marginTop: 7,
    backgroundColor: colors.greenDark,
    borderColor: '#405A42',
    padding: 19,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#314A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTag: {
    backgroundColor: '#D5EDB9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTagText: {
    color: '#24352A',
    letterSpacing: 0.5,
  },
  button: {
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    marginTop: 5,
  },
  buttonText: {
    color: '#17221A',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 11,
  },
  statCard: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'center',
  },
  statNumber: {
    color: colors.green,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  linkText: {
    color: colors.blue,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    minHeight: 87,
  },
  exerciseIcon: {
    width: 49,
    height: 49,
    backgroundColor: colors.surfaceLight,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseMeta: {
    color: colors.green,
  },
  chevron: {
    color: colors.muted,
    paddingHorizontal: 4,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 3,
    paddingTop: 4,
  },
  safetyText: {
    flex: 1,
  },
  recommendationCard: {
    backgroundColor: '#202D37',
    borderColor: '#344956',
    marginTop: 5,
  },
  recommendationTitle: {
    color: colors.blue,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  selectedText: {
    flex: 1,
    gap: 3,
  },
  cameraFrame: {
    height: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#080C10',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  centeredText: {
    textAlign: 'center',
  },
  noticeCard: {
    backgroundColor: '#242A2D',
    borderColor: '#484334',
  },
  noticeTitle: {
    color: colors.amber,
  },
  stepsCard: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.green,
  },
  stepText: {
    flex: 1,
  },
  successCard: {
    backgroundColor: colors.greenDark,
    borderColor: '#405A42',
  },
  successText: {
    color: colors.green,
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  progressCard: {
    marginTop: 5,
    paddingVertical: 23,
  },
  subheading: {
    marginTop: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 14,
  },
  achievementIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    flex: 1,
    gap: 3,
  },
  earnedText: {
    color: colors.green,
  },
  pendingText: {
    color: colors.muted,
    fontSize: 12,
  },
  profileCard: {
    marginTop: 8,
  },
  inputLabel: {
    marginTop: 3,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    color: colors.text,
    backgroundColor: colors.background,
  },
  ageInput: {
    width: 130,
  },
  tabBar: {
    flexDirection: 'row',
    minHeight: 67,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 4,
    paddingTop: 7,
    paddingBottom: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    minHeight: 52,
  },
  selectedTabText: {
    color: colors.green,
  },
  unselectedTabText: {
    color: colors.muted,
  },
});

export default App;
