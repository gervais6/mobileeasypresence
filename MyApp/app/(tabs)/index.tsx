import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        // Si déjà connecté, redirige vers Scan
        router.replace("./scan");
      } else {
        // Sinon, reste sur login
        router.replace("./login");
      }
    };

    checkLogin();
  }, []);

  return null; // écran vide, juste redirection
}
