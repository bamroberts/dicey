import { randomUUID } from "expo-crypto";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createGame, Game } from "../../src/game/engine";
import { decodeSession, Seat } from "./saved-session";
import { decodeHistory, HistoryEntry, recordCompleted } from "./history";
import { Button, Copy, Page } from "./components/ui";
export type { Seat } from "./saved-session";
const KEY = "dicey.session.v1";
type LocalState = {
  gameId: string;
  game: Game | null;
  seats: Seat[];
  handoff: boolean;
  history: HistoryEntry[];
};
type Session = LocalState & {
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
  setHandoff: React.Dispatch<React.SetStateAction<boolean>>;
  saveError: string | null;
  startGame: (seats: Seat[]) => void;
  setupDraft: Seat[] | null;
  prepareRematch: (seats: Seat[] | null) => void;
};
const Context = createContext<Session | null>(null);
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState>(() => ({
    gameId: randomUUID(),
    game: null,
    seats: [
      { id: "p1", name: "Ben", avatar: 4 },
      { id: "p2", name: "Mia", avatar: 5 },
    ],
    handoff: false,
    history: [],
  }));
  const [setupDraft, prepareRematch] = useState<Seat[] | null>(null);
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
          const metadata = JSON.parse(raw);
          const gameId =
            typeof metadata.gameId === "string"
              ? metadata.gameId
              : randomUUID();
          const history = recordCompleted(
            decodeHistory(metadata.history),
            gameId,
            saved.game,
            saved.seats,
          );
          setState({
            gameId,
            game: saved.game,
            seats: saved.seats,
            handoff: saved.handoff,
            history,
          });
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
    const raw = JSON.stringify({ version: 1, ...state });
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(KEY, raw))
      .then(() => setSaveError(null))
      .catch(() =>
        setSaveError(
          "Could not save this game. Keep the app open; your next move will retry.",
        ),
      );
  }, [state, ready]);
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
      value={{
        ...state,
        saveError,
        setupDraft,
        prepareRematch,
        setGame: (value) => {
          const now = new Date().toISOString();
          setState((current) => {
            const game =
              typeof value === "function" ? value(current.game) : value;
            return {
              ...current,
              game,
              history: recordCompleted(
                current.history,
                current.gameId,
                game,
                current.seats,
                now,
              ),
            };
          });
        },
        setHandoff: (value) =>
          setState((current) => ({
            ...current,
            handoff:
              typeof value === "function" ? value(current.handoff) : value,
          })),
        startGame: (seats) => {
          prepareRematch(null);
          const gameId = randomUUID();
          setState((current) => ({
            ...current,
            gameId,
            seats,
            game: createGame(seats),
            handoff: false,
          }));
        },
      }}
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
