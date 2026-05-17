import {
  ReactNode,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";

type ModalContextType = {
  setModal: (modal?: ReactNode) => void;
};

const initialModalContext: ModalContextType = {
  setModal: () => {},
};

export const ModalContext = createContext(initialModalContext);

export function ModalProvider({ children }: React.PropsWithChildren) {
  const [modal, setModal] = useState<ReactNode>(null);
  const { height } = useWindowDimensions();
  const modalPosition = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(modalPosition, {
      toValue: modal ? 0 : height,
      bounciness: 2,
      useNativeDriver: false,
    }).start();
  }, [modal, height, modalPosition]);

  /**
   * Since this provider only provides functions, we need to memoize the value
   * or all consumers will re-render when the provider re-renders.
   */
  const value = useMemo(
    () => ({
      setModal,
    }),
    [],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal ? (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.modalContainer,
            {
              top: modalPosition,
            },
          ]}
        >
          {modal}
        </Animated.View>
      ) : null}
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
