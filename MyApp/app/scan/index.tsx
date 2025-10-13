import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import axios from "axios";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successScan, setSuccessScan] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState({ email: "", password: "" });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [torchMode, setTorchMode] = useState<"on" | "off">("off");
  const [torchAnim] = useState(new Animated.Value(0));
  const [settingsAnim] = useState(new Animated.Value(0));

  const { width, height } = Dimensions.get("window");
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // 🔄 Animation pulsante
  useEffect(() => {
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
  }, []);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  // 🔥 Animation icônes
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(torchAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(torchAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(settingsAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(settingsAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const torchGlow = torchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", "rgba(255,255,150,0.4)"],
  });

  const settingsGlow = settingsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", "rgba(154,97,109,0.5)"],
  });

  // 🧠 Récupération user data (EMAIL + PASSWORD depuis AsyncStorage)
  useEffect(() => {
    const fetchUserData = async () => {
      const email = await AsyncStorage.getItem("email");
      const password = await AsyncStorage.getItem("password");
      setUserData({
        email: email || "",
        password: password || "",
      });
    };
    fetchUserData();
  }, [modalVisible]); // on recharge quand modal s'ouvre/ferme (pratique si changé)

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Toast.show({ type: "info", text1: "Déconnexion réussie !" });
    router.replace("/login");
    setModalVisible(false);
  };

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/scan-sound.mp3"));
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log("Erreur son scan:", error);
    }
  };

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

      // 🔔 Son + vibration
      playSound();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const response = await axios.post(
        "https://backendeasypresence.onrender.com/api/scan/scan-company",
        { userId, qrCodeEntreprise: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: "success", text1: response.data.message || "Présence enregistrée !" });

      // ✅ Délai pour animation avant redirection vers PIN
      setTimeout(() => {
        setSuccessScan(false);
        setScanned(false);
        router.replace("/pin-login"); // ← Redirection vers PIN
      }, 1500);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erreur lors du scan";
      Toast.show({ type: "error", text1: errorMsg });
      setSuccessScan(false);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>Autorisation caméra requise</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        torch={torchMode}
        onBarcodeScanned={({ data }) => {
          if (scanning && !scanned && data) {
            setScanned(true);
            handleScanSuccess(data);
          }
        }}
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.6)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Animated.View style={[styles.headerIcon, { }]}>
          <TouchableOpacity onPress={() => setTorchMode((prev) => (prev === "on" ? "off" : "on"))}>
            <Ionicons name={torchMode === "on" ? "flash" : "flash-off"} size={26} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.headerIcon, {  }]}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="settings-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={styles.text}>Scanner le QR code entreprise</Text>

      <View style={styles.scanFrame}>
        <Animated.View style={[styles.pulse, { transform: [{ scale: pulseScale }] }]} />
        {successScan && (
          <Animated.View style={[styles.successIcon, { transform: [{ scale: pulseScale }] }]}>
            <Ionicons name="checkmark-done-circle" size={80} color="limegreen" />
          </Animated.View>
        )}
      </View>

      {/* Bouton Scan ON/OFF */}
    

      {/* Modal utilisateur — affiche email et mot de passe récupérés */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <LinearGradient colors={["#4A2C2A", "#9A616D"]} start={[0, 0]} end={[0, 1]} style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle-outline" size={80} color="#fff" />
              <Text style={styles.modalTitle}>Utilisateur</Text>
            </View>

            <View style={styles.iconRow}>
              <MaterialIcons name="email" size={24} color="#fff" />
              <Text style={styles.modalText}>{userData.email || "Non défini"}</Text>
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="key-outline" size={24} color="#fff" />
              <Text style={styles.modalText}>{userData.password || "Non défini"}</Text>
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="moon-outline" size={24} color="#fff" />
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <TouchableOpacity style={styles.iconRow}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
              <Text style={styles.modalText}>Support / Aide</Text>
            </TouchableOpacity>
            <View style={styles.iconRow}>
              <Ionicons name="log-out-outline" size={24} color="#FFBABA" />
              <TouchableOpacity onPress={handleLogout}>
                <Text style={[styles.modalText, { color: "#FFBABA" }]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeIconContainer} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={36} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1 },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerIcon: { padding: 8, borderRadius: 50 },
  text: {
    position: "absolute",
    top: Dimensions.get("window").height * 0.18,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    width: "100%",
  },
  scanFrame: {
    position: "absolute",
    top: Dimensions.get("window").height * 0.3,
    left: Dimensions.get("window").width * 0.1,
    width: Dimensions.get("window").width * 0.8,
    height: Dimensions.get("window").width * 0.8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  successIcon: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  scanToggleContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scanToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scanToggleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 50, height: 5, backgroundColor: "#ccc", borderRadius: 3, alignSelf: "center", marginBottom: 15 },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginTop: 10 },
  iconRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  modalText: { fontSize: 16, marginLeft: 12, color: "#fff" },
  closeIconContainer: { position: "absolute", top: 15, right: 15 },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginTop: 10 },
  buttonText: { color: "#9A616D", fontWeight: "bold" },
});
