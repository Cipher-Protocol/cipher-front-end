import { extendTheme } from "@chakra-ui/react";

export const chakraTheme = extendTheme({
  styles: {
    global: {
      body: {
        fontFamily: "Rubik, sans-serif",
      },
    },
  },
  colors: {
    brand: "#6B39AB",
    success: "#4DFFA9",
    warning: "#D1FF4D",
    alert: "##FF54B0",
  },
});
