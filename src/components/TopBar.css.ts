import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme";

export const icon = style({
  transition: "background-color 100ms ease",
  ":hover": {
    backgroundColor: vars.colors.dark[5],
  },
});
