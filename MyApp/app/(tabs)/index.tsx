import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");

        if (!token || !userId) {
          router.replace("/login");
          return;
        }

        const hasPin = await SecureStore.getItemAsync(`userPin_${userId}`);

        if (!hasPin) {
          router.replace("/set-pin");
        } else {
          router.replace("/pin-login");
        }
      } catch (error) {
        console.error("Erreur de redirection:", error);
        router.replace("/login");
      }
    };

    checkLogin();
  }, []);

  return null;
}
