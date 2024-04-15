import React, { useContext } from "react";
import { StyleSheet, View, ScrollView } from "react-native";

import DataUse from "./DataUse";
import Root from "./Root";
import Theme from "./Theme";
import { ThemeContext, t } from "../../contexts/SettingsContexts/ThemeContext";
import URL from "../../utils/URL";

export default function SettingsPage({ url }: { url: string }) {
  const { theme } = useContext(ThemeContext);

  const relativePath = new URL(url).getRelativePath();

  return (
    <View
      style={t(styles.settingsContainer, {
        backgroundColor: theme.background,
      })}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        {relativePath === "settings" && <Root />}
        {relativePath === "settings/theme" && <Theme />}
        {relativePath === "settings/dataUse" && <DataUse />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
