import merge from "lodash/merge";
import { lightTheme, Theme } from "@rainbow-me/rainbowkit";

export const rainbowkitTheme = merge(lightTheme(), {
  radii: {
    connectButton: "100px", // full
  },
  colors: {
    accentColor: "#FFFFFF",
    accentColorForeground: "#6B39AB",
    connectButtonText: "#6B39AB",
  },
} as Theme);
