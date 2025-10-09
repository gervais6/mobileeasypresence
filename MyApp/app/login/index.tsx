import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const API_URL = "https://backendeasypresence.onrender.com/api/auth/login";

  // Animation des vagues
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateWave = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 20, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -20, duration, useNativeDriver: true }),
        ])
      ).start();
    };

    animateWave(waveAnim1, 4000);
    animateWave(waveAnim2, 5000);
    animateWave(waveAnim3, 6000);
  }, []);

  const handleLogin = async () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Veuillez saisir votre email.");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Adresse email invalide.");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Veuillez saisir votre mot de passe.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const response = await axios.post(API_URL, { email, password });
      const { token, role, userId } = response.data;

      // Stocker les informations utilisateur
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userId", String(userId));
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("password", password);

      // Vérifier si l’utilisateur a déjà un PIN
      const existingPin = await SecureStore.getItemAsync(`userPin_${userId}`);

      if (existingPin) {
        router.replace("/pin-login"); // PIN déjà configuré
      } else {
        router.replace("/set-pin"); // première connexion → création du PIN
      }
    } catch (error) {
      console.log("Erreur login:", error?.response?.data);
      if (error.response) {
        const message = error.response.data?.message?.toLowerCase() || "";
        if (message.includes("email")) {
          setEmailError("Adresse email introuvable.");
        } else if (message.includes("password")) {
          setPasswordError("Mot de passe incorrect.");
        } else {
          setPasswordError("Email ou mot de passe incorrect.");
        }
      } else {
        setPasswordError("Erreur de connexion au serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#4A2C2A", "#9A616D"]} start={[0, 0]} end={[0, 1]} style={styles.container}>
        {/* Vagues animées */}
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.wave1, { transform: [{ translateX: waveAnim1 }] }]} />
          <Animated.View style={[styles.wave2, { transform: [{ translateX: waveAnim2 }] }]} />
          <Animated.View style={[styles.wave3, { transform: [{ translateX: waveAnim3 }] }]} />
        </View>

        <View style={styles.inner}>
          <Text style={styles.title}>Connexion</Text>

          <View style={[styles.inputContainer, emailError ? { borderColor: "#ff6b6b" } : {}]}>
            <Ionicons name="mail-outline" size={22} color={emailError ? "#ff6b6b" : "#fff"} style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

          <View style={[styles.inputContainer, passwordError ? { borderColor: "#ff6b6b" } : {}]}>
            <Ionicons name="lock-closed-outline" size={22} color={passwordError ? "#ff6b6b" : "#fff"} style={styles.icon} />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={passwordError ? "#ff6b6b" : "#fff"}
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#9A616D" /> : <Text style={styles.buttonText}>Se connecter</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 25 },
  inner: { width: "100%", maxWidth: 400, zIndex: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 40, textAlign: "center" },
  inputContainer: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.6)", marginBottom: 25, paddingBottom: 8 },
  input: { flex: 1, height: 50, color: "#fff", paddingHorizontal: 10, fontSize: 16 },
  icon: { marginRight: 5 },
  iconRight: { marginLeft: 5 },
  error: { color: "#ffb3b3", fontSize: 13, marginBottom: 10, marginLeft: 5 },
  button: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 20 },
  buttonDisabled: { opacity: 0.8 },
  buttonText: { color: "#9A616D", fontWeight: "bold", fontSize: 18 },
  wave1: { position: "absolute", top: -70, width: width * 1.6, height: 220, backgroundColor: "rgba(255,255,255,0.08)", borderBottomLeftRadius: width * 1.2, borderBottomRightRadius: width * 1.2, transform: [{ rotate: "-12deg" }] },
  wave2: { position: "absolute", top: -90, width: width * 1.8, height: 250, backgroundColor: "rgba(255,255,255,0.12)", borderBottomLeftRadius: width * 1.3, borderBottomRightRadius: width * 1.3, transform: [{ rotate: "-18deg" }] },
  wave3: { position: "absolute", top: -110, width: width * 2, height: 280, backgroundColor: "rgba(255,255,255,0.16)", borderBottomLeftRadius: width * 1.4, borderBottomRightRadius: width * 1.4, transform: [{ rotate: "-22deg" }] },
});
