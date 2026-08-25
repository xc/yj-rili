import type { ThemeConfig } from "antd";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorInfo: "#1677ff",
    colorTextBase: "#001529",
    colorBgBase: "#f5f8fc",
    fontFamily:
      'var(--font-outfit), "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif',
    borderRadius: 2,
  },
  components: {
    Button: {
      primaryShadow: "none",
      fontWeight: 500,
    },
    Form: {
      labelColor: "#001529",
    },
    Input: {
      activeShadow: "none",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemSelectedBg: "#0958d9",
      darkItemHoverBg: "#0a2a4a",
      darkItemColor: "#ffffff",
      darkItemHoverColor: "#ffffff",
      darkItemSelectedColor: "#ffffff",
      darkGroupTitleColor: "#ffffff",
    },
  },
};
