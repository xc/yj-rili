import type { ThemeConfig } from "antd";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#d94a2c",
    colorInfo: "#d94a2c",
    colorTextBase: "#1c1917",
    colorBgBase: "#f3ede3",
    fontFamily: "var(--font-outfit), sans-serif",
    borderRadius: 2,
    controlHeight: 44,
  },
  components: {
    Button: {
      primaryShadow: "none",
      fontWeight: 500,
    },
    Form: {
      labelColor: "#1c1917",
      labelFontSize: 13,
    },
    Input: {
      activeShadow: "none",
    },
  },
};
