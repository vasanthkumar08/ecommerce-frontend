import { useEffect, useState } from "react";
import { getJson, setJson } from "../utils/storage";

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return getJson(key, initialValue);
  });

  useEffect(() => {
    setJson(key, value);
  }, [key, value]);

  return [value, setValue];
}
