import React, { useState } from "react";
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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const API_URL = "https://backendeasypresence.onrender.com/api/auth/login";

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

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userId", String(userId));
      await AsyncStorage.setItem("role", role);

      router.replace("/scan");
    } catch (error: any) {
      console.log("Erreur login:", error?.response?.data);

      if (error.response) {
        const message = error.response.data?.message?.toLowerCase() || "";

        if (message.includes("email")) {
          setEmailError("Adresse email introuvable.");
        } else if (message.includes("password") || message.includes("mot de passe")) {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* --- VAGUES BACKGROUND --- */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.wave1} />
        <View style={styles.wave2} />
      </View>

      {/* --- FORMULAIRE --- */}
      <View style={styles.inner}>
        <Text style={styles.title}>Connexion</Text>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#fff" style={styles.icon} />
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

        {/* Mot de passe */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.icon} />
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
              color="#fff"
              style={styles.iconRight}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

        {/* Bouton Connexion */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#9A616D" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#9A616D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  inner: {
    width: "100%",
    maxWidth: 400,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: 25,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#fff",
    paddingHorizontal: 10,
    fontSize: 16,
  },
  icon: { marginRight: 5 },
  iconRight: { marginLeft: 5 },
  error: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#9A616D",
    fontWeight: "bold",
    fontSize: 18,
  },
  wave1: {
    position: "absolute",
    top: -50,
    width: width * 1.5,
    height: 200,
    backgroundColor: "#b97b85",
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    transform: [{ rotate: "-15deg" }],
  },
  wave2: {
    position: "absolute",
    top: -80,
    width: width * 1.5,
    height: 200,
    backgroundColor: "#9A616D",
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    transform: [{ rotate: "-20deg" }],
  },
});
