import { useState } from "react";
import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Button, Copy } from "./ui";
export function InvitationActions({
  code,
  name,
}: {
  code: string;
  name: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  async function copy() {
    try {
      await Clipboard.setStringAsync(code);
      setMessage("Invitation code copied!");
    } catch {
      setMessage("Could not copy. You can select and copy the code above.");
    }
  }
  async function share() {
    try {
      const text = `${name} challenged you to Dicey! Open Challenge friends and enter this invitation code: ${code}`;
      if (Platform.OS === "web" && !navigator.share) {
        await Clipboard.setStringAsync(text);
        setMessage("Invitation copied—paste it to a friend.");
      } else if (Platform.OS === "web") {
        await navigator.share({ title: "Dicey! challenge", text });
      } else {
        await Share.share({ message: text, title: "Dicey! challenge" });
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        setMessage("Could not open sharing. Try copying the invitation code.");
    }
  }
  return (
    <>
      <Button title="Share invitation →" onPress={() => void share()} />
      <Button
        title="Copy invitation code"
        secondary
        onPress={() => void copy()}
      />
      {message && <Copy>{message}</Copy>}
    </>
  );
}
