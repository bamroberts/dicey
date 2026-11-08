import { Text, TextInput, View } from "react-native";
import { colors as c } from "../theme";
import { s } from "./ui";
export function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={{
          color: c.ivory,
          backgroundColor: c.night,
          borderWidth: 2,
          borderColor: c.blue,
          borderRadius: 12,
          padding: 14,
          minHeight: 52,
          fontSize: 18,
        }}
      />
    </View>
  );
}
