import { Text, View } from "react-native";
import { useIsShake } from "./useIsShake";

export default function Index() {
  const { isShakeTriggered, setIsShakeReady } = useIsShake();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
