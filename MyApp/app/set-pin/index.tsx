import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function SetPinScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState(1); // 1: entrer PIN, 2: confirmer PIN
  const router = useRouter();

  const dotAnimations = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  // Animation des points
  useEffect(() => {
    if (pin.length > 0) {
      Animated.sequence([
        Animated.timing(dotAnimations[pin.length - 1], { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(dotAnimations[pin.length - 1], { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [pin]);

  // Validation automatique dès que 4 chiffres sont entrés
  useEffect(() => {
    if (pin.length === 4) handleNext();
  }, [pin]);

  const handleDigitPress = (digit) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleNext = async () => {
    if (pin.length !== 4) return;

    if (step === 1) {
      setConfirmPin(pin);
      setPin("");
      setStep(2);
    } else if (step === 2) {
      if (pin !== confirmPin) {
        // PIN différent, reset
        setPin("");
        setConfirmPin("");
        setStep(1);
        return;
      }

      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        await SecureStore.setItemAsync(`userPin_${userId}`, pin);
        setPin("");
        setConfirmPin("");
        router.replace("/scan");
      } catch (error) {
        setPin("");
        setConfirmPin("");
      }
    }
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⌫", "0", "✔️"]
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#4A2C2A", "#9A616D"]} start={[0, 0]} end={[0, 1]} style={styles.container}>
        <Text style={styles.title}>{step === 1 ? "Créer un code PIN" : "Confirmer le code PIN"}</Text>
        <Text style={styles.subtitle}>Entrez un code PIN à 4 chiffres</Text>

        {/* Points */}
        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((i) => {
            const scale = dotAnimations[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.pinDot,
                  pin.length > i && { backgroundColor: "#fff", transform: [{ scale }] },
                ]}
              />
            );
          })}
        </View>

        {/* Numpad */}
        <View style={styles.numPad}>
          {keys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((key) => {
                const onPress = () => {
                  if (key === "⌫") handleDelete();
                  else if (key === "✔️") handleNext(); // bouton manuel
                  else handleDigitPress(key);
                };
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.numButton, key === "✔️" && styles.submitButton]}
                    onPress={onPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.numText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 10 },
  subtitle: { color: "#fff", fontSize: 16, marginBottom: 30, textAlign: "center" },
  pinContainer: { flexDirection: "row", justifyContent: "space-between", width: "60%", marginBottom: 40 },
  pinDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#fff" },
  numPad: { width: "80%" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  numButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: { backgroundColor: "#9A616D" },
  numText: { color: "#fff", fontSize: 26, fontWeight: "700" },
});
