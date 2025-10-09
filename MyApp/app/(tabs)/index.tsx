import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        router.replace("/scan"); // Expo Router recommande "/" pour le chemin racine
      } else {
        router.replace("/login");
      }
    };

    checkLogin();
  }, []);

  return null;
}
