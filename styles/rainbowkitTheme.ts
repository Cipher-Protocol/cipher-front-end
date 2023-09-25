import merge from "lodash/merge";
import { lightTheme, Theme } from "@rainbow-me/rainbowkit";

export const rainbowkitTheme = merge(lightTheme(), {
  radii: {
    connectButton: "100px", // full
  },
} as Theme);
