import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successScan, setSuccessScan] = useState(false);
  const { width } = Dimensions.get("window");
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 🔄 Animation scanner
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [scanning]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  // ✅ Déconnexion
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
    Toast.show({ type: "info", text1: "Déconnexion réussie !" });
    router.replace("/login");
  };

  // ✅ Scan QR
  const handleScanSuccess = async (data: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        Toast.show({ type: "error", text1: "Veuillez vous reconnecter." });
        return;
      }

      if (!data.startsWith("company_")) {
        Toast.show({ type: "error", text1: "QR code invalide pour l'entreprise." });
        return;
      }

      setLoading(true);
      setSuccessScan(true);

      const response = await axios.post(
        "https://backendeasypresence.onrender.com/api/scan/scan-company",
        { userId, qrCodeEntreprise: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: "success", text1: response.data.message || "Présence enregistrée !" });

      setTimeout(() => {
        setSuccessScan(false);
        setScanned(false);
        setScanning(false);
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erreur lors de la validation du QR code";
      Toast.show({ type: "error", text1: errorMsg });
      setSuccessScan(false);
      setScanned(false);
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Autorisation caméra requise</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔒 Icône Déconnexion en haut à droite */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <Ionicons name="log-out-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Scanner le QR code entreprise</Text>

      {scanning ? (
        <View style={{ position: "relative", width: width * 0.8, height: width * 0.8 }}>
          <CameraView
            style={{ width: "100%", height: "100%", borderRadius: 20, overflow: "hidden" }}
            onBarcodeScanned={({ data }) => {
              if (!scanned && data) {
                setScanned(true);
                handleScanSuccess(data);
              }
            }}
          />

          {/* Coins du cadre */}
          <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />

          {/* Animation Pulse */}
          <Animated.View style={[styles.pulse, { transform: [{ scale: pulseScale }] }]} />

          {/* ✅ Icône succès */}
          {successScan && (
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 64 }}>✅</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={() => {
            setScanning(true);
            setScanned(false);
          }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ouvrir le scanner</Text>}
        </TouchableOpacity>
      )}

      {scanning && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9A616D",
    padding: 20,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    left: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  logoutIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 50,
  },
  text: { 
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  button: { 
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: { 
    color: "#9A616D",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
  },
  cancelText: {
    color: "#9A616D",
    fontWeight: "bold",
    fontSize: 14,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
    borderRadius: 8,
  },
  pulse: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "80%",
    height: "80%",
    marginLeft: "-40%",
    marginTop: "-40%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  successIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -32,
    marginTop: -32,
    zIndex: 999,
  },
});
