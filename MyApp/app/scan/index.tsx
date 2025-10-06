import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator 
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import axios from "axios";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width } = Dimensions.get("window");

  // 🧾 Fonction appelée après un QR valide
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
      const response = await axios.post(
        "https://backendeasypresence.onrender.com/api/scan/scan-company",
        { userId, qrCodeEntreprise: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: "success", text1: response.data.message || "Présence enregistrée !" });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la validation du QR code";
      Toast.show({ type: "error", text1: errorMsg });
    } finally {
      setLoading(false);
      setScanned(false);
      setScanning(false);
    }
  };

  // ⚙️ Autorisation caméra
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

  // 📸 Interface principale
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scanner le QR code entreprise</Text>

      {scanning ? (
        <CameraView
          style={{ width: width * 0.8, height: width * 0.8 }}
          onBarcodeScanned={({ data }) => {
            if (!scanned && data) {
              setScanned(true);
              handleScanSuccess(data);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={() => {
            setScanning(true);
            setScanned(false);
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#9A616D" />
          ) : (
            <Text style={styles.buttonText}>Ouvrir le scanner</Text>
          )}
        </TouchableOpacity>
      )}

      {scanning && (
        <TouchableOpacity
          style={[styles.cancelButton]}
          onPress={() => setScanning(false)}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#9A616D" 
  },
  text: { 
    color: "#fff", 
    fontSize: 20, 
    marginBottom: 20, 
    textAlign: "center" 
  },
  button: { 
    backgroundColor: "#fff", 
    padding: 15, 
    borderRadius: 10, 
    minWidth: 200, 
    alignItems: "center" 
  },
  buttonText: { 
    color: "#9A616D", 
    fontWeight: "bold" 
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: "#9A616D",
    fontWeight: "bold",
  },
});
