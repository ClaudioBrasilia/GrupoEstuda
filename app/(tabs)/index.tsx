import { View, Pressable, Share, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { WebViewContainer } from "@/components/web-view-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const GRUPO_ESTUDA_URL = "https://study-group-boost.lovable.app";

export default function HomeScreen() {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: "Confira o Grupo Estuda - uma plataforma de estudos em grupo!",
        url: GRUPO_ESTUDA_URL,
        title: "Grupo Estuda",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar");
    }
  };

  const handleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Menu", "Selecione uma opção", [
      {
        text: "Sobre",
        onPress: () => {
          Alert.alert(
            "Sobre o Grupo Estuda",
            "Versão 1.0.0\n\nUma plataforma de estudos em grupo para melhorar seu aprendizado.",
            [{ text: "OK" }]
          );
        },
      },
      {
        text: "Configurações",
        onPress: () => {
          Alert.alert("Configurações", "Configurações em desenvolvimento", [
            { text: "OK" },
          ]);
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={handleMenu}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <MaterialIcons name="menu" size={24} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerTitle}>
            <MaterialIcons name="school" size={24} color={colors.primary} />
          </View>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <MaterialIcons name="share" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* WebView */}
      <WebViewContainer
        url={GRUPO_ESTUDA_URL}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerButtonPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
});
