import { Feather } from "@expo/vector-icons";
import React, { useContext, useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountContext } from "../../contexts/AccountContext";
import { ModalContext } from "../../contexts/ModalContext";
import { ThemeContext } from "../../contexts/SettingsContexts/ThemeContext";
import { WebView } from "react-native-webview";
import RedditCookies from "../../utils/RedditCookies";
import { shouldFinishRedditLogin } from "../../utils/RedditLoginFlow";

const INJECTED_JAVASCRIPT = `
  true;
`;

export default function Login() {
  const { theme } = useContext(ThemeContext);
  const { logIn, doWithTempLogout } = useContext(AccountContext);
  const { setModal } = useContext(ModalContext);
  const [canShow, setCanShow] = useState(false);

  const { width, height } = useWindowDimensions();

  const loginFinished = useRef(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const handleLoginCanceled = () => {
    resolver.current?.(true);
    setModal(null);
  };

  const handleLoginFailed = () => {
    resolver.current?.(true);
    Alert.alert("Login failed", "Something went wrong");
  };

  const handleLoginFinished = async () => {
    if (loginFinished.current) return;
    loginFinished.current = true;
    setModal(null);
    const loginSuccess = await logIn();
    if (!loginSuccess) {
      handleLoginFailed();
    } else {
      resolver.current?.(false);
    }
  };

  useEffect(() => {
    const promise = new Promise<boolean>(
      (resolve) => (resolver.current = resolve),
    );
    doWithTempLogout(() => {
      setCanShow(true);
      return promise;
    });
  }, []);

  useEffect(() => {
    /**
     * Backup method using polling to check if the session cookie has been set.
     * This is necessary because the onLoadStart event isn't triggering for all
     * users. I've been unable to reproduce the issue and it may be because Reddit
     * is running an experiment.
     */
    if (!canShow) return;
    const interval = setInterval(async () => {
      const hasSessionCookie = await RedditCookies.hasSessionCookieBeenSet();
      if (shouldFinishRedditLogin({ hasSessionCookie })) {
        handleLoginFinished();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [canShow]);

  return (
    <View style={[styles.loginContainer, { width, height }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navbar}>
          <View style={styles.navbarTitleContainer}>
            <Text style={styles.navbarText}>Login</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleLoginCanceled()}
            style={styles.closeButton}
            hitSlop={15}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.webViewContainer}>
          {!canShow ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <WebView
              source={{
                uri: "https://www.reddit.com/login?dest=https://www.reddit.com/r/HydraClient",
              }}
              style={styles.webView}
              androidLayerType="hardware"
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              injectedJavaScript={INJECTED_JAVASCRIPT}
              // Injected js doesn't run unless you pass a function here even if it doesn't do anything. No idea why.
              onMessage={() => {}}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    backgroundColor: "black",
  },
  safeArea: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
    justifyContent: "flex-end",
    minHeight: 44,
  },
  navbarTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  navbarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  closeButton: {
    zIndex: 1,
    marginLeft: "auto",
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
