import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function PinLoginScreen() {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [resetStep, setResetStep] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const maxAttempts = 3;
  const router = useRouter();

  const dotAnimations = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Animation overlay
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(overlayAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 4000, useNativeDriver: true, easing: Easing.linear }),
      ])
    ).start();
  }, []);

  // Animation points PIN
  useEffect(() => {
    if (pin.length > 0) {
      Animated.sequence([
        Animated.timing(dotAnimations[pin.length - 1], { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(dotAnimations[pin.length - 1], { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [pin]);

  useEffect(() => {
    if (!resetStep && pin.length === 4) checkPin();
  }, [pin]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const checkPin = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return setPin("");
      const savedPin = await SecureStore.getItemAsync(`userPin_${userId}`);
      if (pin === savedPin) {
        router.replace("/scan");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");
        if (newAttempts >= maxAttempts) setResetStep(true);
      }
    } catch (error) {
      setPin("");
    }
  };

  const handleNewPin = () => {
    if (pin.length === 4) {
      setNewPin(pin);
      setPin("");
    }
  };

  const handleConfirmNewPin = async () => {
    if (pin.length === 4) {
      setConfirmPin(pin);
      if (newPin === pin) {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) await SecureStore.setItemAsync(`userPin_${userId}`, newPin);
        setPin(""); setNewPin(""); setConfirmPin(""); setResetStep(false);
      } else {
        setPin(""); setNewPin(""); setConfirmPin("");
      }
    }
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⌫", "0", "OK"],
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient
        colors={['#4A2C2A', '#9A616D', '#FFB6B9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Overlay animé */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.05)',
            opacity: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.3] }),
          }}
        />

        {!resetStep ? (
          <>
            <Text style={styles.title}>Connexion par PIN</Text>
            <Text style={styles.subtitle}>Entrez votre code PIN pour continuer</Text>
            {attempts > 0 && (
              <Text style={styles.attemptText}>
                Il vous reste {maxAttempts - attempts} tentative(s) avant la réinitialisation
              </Text>
            )}
          </>
        ) : !newPin ? (
          <>
            <Text style={styles.title}>Réinitialiser le PIN</Text>
            <Text style={styles.subtitle}>Entrez votre nouveau PIN (4 chiffres)</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Confirmer le PIN</Text>
            <Text style={styles.subtitle}>Confirmez votre nouveau PIN</Text>
          </>
        )}

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
                  {
                    shadowColor: "#fff",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  },
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
                  else if (key === "OK") {
                    if (!resetStep) checkPin();
                    else if (!newPin) handleNewPin();
                    else handleConfirmNewPin();
                  } else handleDigitPress(key);
                };
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.numButton} // tous les boutons identiques
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

        {/* Liens */}
        {!resetStep ? (
          <TouchableOpacity onPress={() => setResetStep(true)} style={{ marginTop: 20 }}>
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setResetStep(false)} style={{ marginTop: 20 }}>
            <Text style={styles.linkText}>Revenir à la connexion</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 10 },
  subtitle: { color: "#fff", fontSize: 14, marginBottom: 30, textAlign: "center" },
  attemptText: { color: "#ff4d4d", marginBottom: 20, fontSize: 14, textAlign: "center", fontWeight: "bold" },
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
  numText: { color: "#fff", fontSize: 26, fontWeight: "700" },
  linkText: { color: "#fff", fontWeight: "600", marginTop: 15 },
});
