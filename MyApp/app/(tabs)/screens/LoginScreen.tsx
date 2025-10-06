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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter(); // <-- Assure-toi que c'est là

  const API_URL = Platform.OS === "web"
    ? "http://localhost:8000/api/auth/login"
    : "http://192.168.1.4:8000/api/auth/login";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(API_URL, { email, password });
      const { token, role, userId } = response.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userId", userId);
      await AsyncStorage.setItem("role", role);

      // Redirection selon rôle
      if (role === "admin") {
        router.replace("/Dashboard"); // <-- ici router est bien défini
      } else {
        router.replace("/Scan");      // <-- ici aussi
      }
    } catch (error) {
      console.error("Erreur login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Connectez-vous</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#9A616D" },
  card: { width: "100%", padding: 30, borderRadius: 20, backgroundColor: "#fff", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30 },
  input: { width: "100%", height: 50, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  button: { backgroundColor: "#9A616D", padding: 15, borderRadius: 10, alignItems: "center", width: "100%" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
