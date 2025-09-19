import React, { useEffect, useState } from "react";
import CyberContent from "../CyberContent/CyberContent";
import Button from "../Button/Button";
import useSound from "use-sound";
import * as S from "./styles";
import JSConfetti from "js-confetti";

// Import JSON bundled by Vite/CRA
import db from "../../assets/csvjson.json";

const ASSETS = `${process.env.PUBLIC_URL || ""}/assets/`;
const SOUND_CLICK = ASSETS + "sounds/winner-long.mp3";
const jsConfetti = new JSConfetti();
const TIME_DURING_STOP = 6000;

type Person = { _id: string; employeeName: string };

type RawRow =
  | { firstName?: string; lastName?: string; email?: string }
  // in case you keep the Excel-style keys with spaces/colons:
  | { ["First Name"]?: string; ["Last Name"]?: string; Email?: string }
  | { ["First Name :"]?: string; ["Last Name :"]?: string; ["Email :"]?: string };

const NamePicker = () => {
  const [allNames, setAllNames] = useState<Person[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [buttonState, setButtonState] = useState<"enable" | "disabling">("enable");
  const [playSound] = useSound(SOUND_CLICK);

  useEffect(() => {
    // db is already an array of objects
    const raw = (db as RawRow[]) ?? [];
    const rows: Person[] = raw
      .map((r, idx) => {
        // read camelCase first, then fall back to Excel-style keys
        const first =
          (r as any).firstName ??
          (r as any)["First Name"] ??
          (r as any)["First Name :"] ??
          "";
        const last =
          (r as any).lastName ??
          (r as any)["Last Name"] ??
          (r as any)["Last Name :"] ??
          "";
        const email =
          (r as any).email ??
          (r as any).Email ??
          (r as any)["Email :"] ??
          "";

        const fname = String(first).trim();
        const lname = String(last).trim();
        const mail = String(email).trim();

        const name = [fname, lname].filter(Boolean).join(" ");
        if (!name) return null;
        return { _id: mail || `row-${idx + 1}`, employeeName: name } as Person;
      })
      .filter(Boolean) as Person[];

    // de-dupe by _id
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      const k = r._id.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    setAllNames(unique);
    setCurrentIndex(0);
    setCurrentName("");
  }, []);

  const handleStart = () => {
    if (timer || allNames.length === 0) return;
    playSound();
    const t = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % allNames.length;
        setCurrentName(allNames[next]?.employeeName || "");
        return next;
      });
    }, 50);
    setTimer(t);
  };

  const handleStop = () => {
    if (buttonState === "disabling") return;
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    jsConfetti.addConfetti({ confettiColors: ["#9D805F"], confettiNumber: 500 });

    setButtonState("disabling");
    setTimeout(() => {
      const winner = allNames[currentIndex];
      if (winner) setAllNames((prev) => prev.filter((p) => p._id !== winner._id));
      setCurrentIndex(0);
      setButtonState("enable");
    }, TIME_DURING_STOP);
  };

  return (
    <S.Wrapper>
      <S.CyberText>
        <CyberContent>{currentName || (allNames.length ? "" : "No names loaded")}</CyberContent>
      </S.CyberText>
      <S.ButtonWrapper>
        {allNames.length === 0 ? (
          <div><Button secondary disabled>No names loaded</Button></div>
        ) : !timer ? (
          <div onClick={handleStart}><Button>Start</Button></div>
        ) : buttonState === "enable" ? (
          <div onClick={handleStop}><Button secondary>Stop</Button></div>
        ) : (
          <div><Button secondary>WAIT</Button></div>
        )}
      </S.ButtonWrapper>
    </S.Wrapper>
  );
};

export default NamePicker;
