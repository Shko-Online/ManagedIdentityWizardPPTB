import { addons } from "storybook/manager-api";
import yourTheme from "./YourTheme";

addons.setConfig({
  sidebar: { showRoots: false },
  theme: yourTheme,
});
