import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Game } from "../../src/game/engine";
import { decodeSession, Seat } from "./saved-session";
import { Button, Copy, Page } from "./components/ui";
export type { Seat } from "./saved-session";
const KEY = "dicey.session.v1";
type Session = {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
  seats: Seat[];
  setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
  handoff: boolean;
  setHandoff: React.Dispatch<React.SetStateAction<boolean>>;
  saveError: string | null;
};
const Context = createContext<Session | null>(null);
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<Game | null>(null);
  const [seats, setSeats] = useState<Seat[]>([
    { id: "p1", name: "Ben", avatar: 4 },
    { id: "p2", name: "Mia", avatar: 5 },
  ]);
  const [handoff, setHandoff] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const saved = decodeSession(raw);
          setGame(saved.game);
          setSeats(saved.seats);
          setHandoff(saved.handoff);
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify({ version: 1, game, seats, handoff });
    // Serialize writes so an older async save cannot overwrite a newer turn.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(KEY, raw))
      .then(() => setSaveError(null))
      .catch(() =>
        setSaveError(
          "Could not save this game. Keep the app open; your next move will retry.",
        ),
      );
  }, [game, seats, handoff, ready]);
  if (loadError && !ready)
    return (
      <Page>
        <Copy>
          We couldn’t restore the saved game. It may be incompatible or storage
          may be unavailable.
        </Copy>
        <Button
          title="Start fresh on this device"
          onPress={() => {
            setLoadError(false);
            setReady(true);
          }}
        />
      </Page>
    );
  if (!ready)
    return (
      <Page>
        <Copy>Finding your dice…</Copy>
      </Page>
    );
  return (
    <Context.Provider
      value={{ game, setGame, seats, setSeats, handoff, setHandoff, saveError }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing game provider");
  return context;
}
