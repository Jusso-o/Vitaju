import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import {
  Delegate,
  KnownPoseLandmarkConnections,
  RunningMode,
  usePoseDetection,
} from 'react-native-mediapipe-posedetection';
import { useCameraPermission, useCameraDevice } from 'react-native-vision-camera';

const MODEL = 'pose_landmarker_lite.task';
const DETECTOR_OPTIONS = {
  numPoses: 1,
  minPoseDetectionConfidence: 0.45,
  minPosePresenceConfidence: 0.4,
  minTrackingConfidence: 0.4,
  delegate: Delegate.CPU,
  mirrorMode: 'mirror-front-only',
  fpsMode: 8,
};
const MIN_LANDMARK_VISIBILITY = 0.25;
const POSE_STALE_TIMEOUT_MS = 1000;
const WRIST_ABOVE_SHOULDER_MARGIN = 0.08;
const WRIST_RETURN_MARGIN = 0.02;
const REQUIRED_TRANSITION_FRAMES = 2;
const SKELETON_CONNECTIONS = KnownPoseLandmarkConnections.filter(
  ([from, to]) => from >= 11 && from <= 32 && to >= 11 && to <= 32,
);

export default function PoseCapture({ onMetricsChange, renderText, trackArmRaises }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [posePoints, setPosePoints] = useState([]);
  const [poseVisible, setPoseVisible] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStatus, setCameraStatus] = useState('Iniciando câmera...');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const poseStatusTimer = useRef(null);
  const detectedFrames = useRef(0);
  const movementCount = useRef(0);
  const armPhase = useRef('down');
  const transitionFrames = useRef(0);

  const clearPoseStatus = useCallback(() => {
    if (poseStatusTimer.current !== null) {
      clearTimeout(poseStatusTimer.current);
      poseStatusTimer.current = null;
    }
    setPosePoints([]);
    setPoseVisible(false);
  }, []);

  const onResults = useCallback((result, viewCoordinator) => {
    const detectedPose =
      result.results?.[0]?.landmarks?.[0] ?? result.landmarks?.[0] ?? [];
    if (detectedPose.length < 33) {
      clearPoseStatus();
      onMetricsChange({
        movementCount: movementCount.current,
        detectedFrames: detectedFrames.current,
      });
      return;
    }

    detectedFrames.current += 1;
    setPoseVisible(true);
    if (poseStatusTimer.current !== null) {
      clearTimeout(poseStatusTimer.current);
    }
    poseStatusTimer.current = setTimeout(() => {
      poseStatusTimer.current = null;
      setPosePoints([]);
      setPoseVisible(false);
    }, POSE_STALE_TIMEOUT_MS);

    const visibleArms = [
      { shoulder: detectedPose[11], wrist: detectedPose[15] },
      { shoulder: detectedPose[12], wrist: detectedPose[16] },
    ].filter(
      ({ shoulder, wrist }) =>
        (shoulder.visibility ?? shoulder.presence ?? 1) >= MIN_LANDMARK_VISIBILITY &&
        (wrist.visibility ?? wrist.presence ?? 1) >= MIN_LANDMARK_VISIBILITY,
    );

    if (trackArmRaises && visibleArms.length === 0) {
      transitionFrames.current = 0;
    } else if (trackArmRaises) {
      const armRaised = visibleArms.some(
        ({ shoulder, wrist }) =>
          wrist.y < shoulder.y - WRIST_ABOVE_SHOULDER_MARGIN,
      );
      const armsReturned = visibleArms.every(
        ({ shoulder, wrist }) => wrist.y >= shoulder.y - WRIST_RETURN_MARGIN,
      );

      if (armPhase.current === 'down') {
        transitionFrames.current = armRaised ? transitionFrames.current + 1 : 0;
        if (transitionFrames.current >= REQUIRED_TRANSITION_FRAMES) {
          armPhase.current = 'raised';
          transitionFrames.current = 0;
        }
      } else {
        transitionFrames.current = armsReturned ? transitionFrames.current + 1 : 0;
        if (transitionFrames.current >= REQUIRED_TRANSITION_FRAMES) {
          armPhase.current = 'down';
          transitionFrames.current = 0;
          movementCount.current += 1;
        }
      }
    }

    const frameDimensions = viewCoordinator.getFrameDims(result);
    setPosePoints(
      detectedPose.map((point) => ({
        ...point,
        ...viewCoordinator.convertPoint(frameDimensions, point),
      })),
    );
    onMetricsChange({
      movementCount: movementCount.current,
      detectedFrames: detectedFrames.current,
    });
  }, [clearPoseStatus, onMetricsChange, trackArmRaises]);

  const onDetectionError = useCallback((error) => {
    clearPoseStatus();
    setCameraError(`A detecção de pose falhou: ${error.message}`);
  }, [clearPoseStatus]);
  const onCameraError = useCallback((error) => {
    clearPoseStatus();
    setCameraError(`A câmera falhou: ${error.message}`);
    setCameraStatus('Erro ao iniciar a câmera');
  }, [clearPoseStatus]);
  const onCameraInitialized = useCallback(() => {
    setCameraStatus('Câmera pronta; procurando o corpo');
  }, []);
  const onPreviewStarted = useCallback(() => {
    setCameraStatus('Fluxo de câmera iniciado');
  }, []);
  const onPreviewStopped = useCallback(() => {
    clearPoseStatus();
    setCameraStatus('Preview da câmera interrompida');
  }, [clearPoseStatus]);

  useEffect(() => () => {
    if (poseStatusTimer.current !== null) {
      clearTimeout(poseStatusTimer.current);
    }
  }, []);

  const poseSolution = usePoseDetection(
    { onResults, onError: onDetectionError },
    RunningMode.LIVE_STREAM,
    MODEL,
    DETECTOR_OPTIONS,
  );

  useEffect(() => {
    if (device) {
      poseSolution.cameraDeviceChangeHandler(device);
    }
  }, [device, poseSolution.cameraDeviceChangeHandler]);

  useEffect(() => {
    poseSolution.resizeModeChangeHandler('contain');
  }, [poseSolution.resizeModeChangeHandler]);

  const enableCamera = async () => {
    setPermissionBusy(true);
    setCameraError('');
    try {
      const granted = await requestPermission();
      if (!granted) {
        setCameraError('Sem permissão da câmera. Autorize o acesso nas configurações do aparelho.');
      }
    } catch (error) {
      Alert.alert('Não foi possível solicitar acesso à câmera', error.message);
    } finally {
      setPermissionBusy(false);
    }
  };

  const Txt = renderText;

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Txt size={16} bold>A câmera só é ativada com sua permissão.</Txt>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={permissionBusy}
          onPress={enableCamera}
          style={styles.permissionButton}
        >
          <Txt size={15} bold style={styles.permissionButtonText}>
            {permissionBusy ? 'Solicitando permissão...' : 'Permitir acesso à câmera'}
          </Txt>
        </TouchableOpacity>
        {cameraError ? <Txt size={12} style={styles.errorText}>{cameraError}</Txt> : null}
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Txt size={15} bold>Câmera frontal não encontrada.</Txt>
      </View>
    );
  }

  return (
    <View style={styles.preview}>
      <Camera
        style={[StyleSheet.absoluteFill, styles.cameraPreview]}
        device={device}
        isActive={true}
        preview={true}
        pixelFormat="rgb"
        resizeMode="contain"
        androidPreviewViewType="texture-view"
        frameProcessor={poseSolution.frameProcessor}
        onLayout={poseSolution.cameraViewLayoutChangeHandler}
        onOutputOrientationChanged={poseSolution.cameraOrientationChangedHandler}
        onInitialized={onCameraInitialized}
        onPreviewStarted={onPreviewStarted}
        onPreviewStopped={onPreviewStopped}
        onError={onCameraError}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.poseOverlay]}>
        {SKELETON_CONNECTIONS.map(([from, to]) => {
          const start = posePoints[from];
          const end = posePoints[to];
          if (
            !start ||
            !end ||
            (start.visibility ?? start.presence ?? 1) < MIN_LANDMARK_VISIBILITY ||
            (end.visibility ?? end.presence ?? 1) < MIN_LANDMARK_VISIBILITY
          ) {
            return null;
          }
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const midpointX = (start.x + end.x) / 2;
          const midpointY = (start.y + end.y) / 2;
          return (
            <View
              key={`${from}-${to}`}
              style={[
                styles.skeletonLine,
                {
                  left: midpointX - length / 2,
                  top: midpointY - styles.skeletonLine.height / 2,
                  width: length,
                  transform: [{ rotate: `${angle}rad` }],
                },
              ]}
            />
          );
        })}
        {posePoints.map((point, index) => {
          if (
            index < 11 ||
            (point.visibility ?? point.presence ?? 1) < MIN_LANDMARK_VISIBILITY ||
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y)
          ) {
            return null;
          }
          return (
            <View
              key={index}
              style={[styles.skeletonPoint, { left: point.x - 4, top: point.y - 4 }]}
            />
          );
        })}
      </View>
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, poseVisible ? styles.statusFound : styles.statusSearching]} />
        <Txt size={12} bold>
          {cameraStatus === 'Fluxo de câmera iniciado'
            ? poseVisible
              ? 'Quadros recebidos · corpo detectado'
              : 'Fluxo ativo · procurando corpo'
            : cameraStatus}
        </Txt>
      </View>
      {cameraError ? (
        <View style={styles.errorBanner}>
          <Txt size={12} bold style={styles.errorText}>{cameraError}</Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#080C10',
  },
  cameraPreview: {
    zIndex: 0,
  },
  poseOverlay: {
    zIndex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
    backgroundColor: '#080C10',
  },
  permissionButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B9E58A',
  },
  permissionButtonText: {
    color: '#17221A',
  },
  statusPill: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 21, 29, 0.88)',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusFound: {
    backgroundColor: '#B9E58A',
  },
  statusSearching: {
    backgroundColor: '#F2D59A',
  },
  skeletonLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B9E58A',
  },
  skeletonPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4F7F2',
    borderWidth: 1,
    borderColor: '#10151D',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    padding: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 21, 29, 0.92)',
  },
  errorText: {
    color: '#F2D59A',
    textAlign: 'center',
  },
});
