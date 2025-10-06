import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import Toast from "react-native-toast-message";
import axios from "axios";

const ScanScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  // Demande d'autorisation pour la caméra
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);

    if (!data.startsWith("company_")) {
      Toast.show({ type: "error", text1: "QR Code invalide" });
      return;
    }

    setLoading(true);
    try {
      const token = "TON_TOKEN_ICI";
      const userId = "USER_ID_ICI";

      const response = await axios.post(
        "http://localhost:8000/api/scan/scan-company",
        { userId, qrCodeEntreprise: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScanResult({ success: true, message: response.data.message || "Présence enregistrée !" });
      Toast.show({ type: "success", text1: response.data.message });
    } catch {
      setScanResult({ success: false, message: "Erreur lors de la validation du QR code" });
      Toast.show({ type: "error", text1: "Erreur lors de la validation du QR code" });
    } finally {
      setLoading(false);
    }
  };

  const { width } = Dimensions.get("window");

  // Gestion des permissions
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Demande autorisation caméra...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Accès à la caméra refusé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner le QR Code Entreprise</Text>

      {scanning ? (
        <View style={{ width: width * 0.8, height: width * 0.8 }}>
          <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
        </View>
      ) : (
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>Ouvrir le scanner</Text>}
        </TouchableOpacity>
      )}

      {scanResult && (
        <Text style={{ color: scanResult.success ? "#4CAF50" : "#FF5252", marginTop: 20 }}>
          {scanResult.message}
        </Text>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#9A616D", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#fff", textAlign: "center" },
  scanButton: { backgroundColor: "#fff", padding: 15, borderRadius: 10 },
  scanButtonText: { color: "#9A616D", fontWeight: "bold" },
});

export default ScanScreen;
