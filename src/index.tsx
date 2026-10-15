/* @refresh reload */
import "@fontsource-variable/geist";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { render } from "solid-js/web";
import App from "./App";
import "./styles/index.css";

render(() => <App />, document.getElementById("root") as HTMLElement);

// The window starts hidden (tauri.conf.json: "visible": false) so it never
// shows a blank or wrongly themed frame. By this point it's safe to show: the
// stylesheet is render-blocking (loaded before this module ran), the pre-paint
// script in index.html applied the cached colors, and render() above is
// synchronous. Don't wait for requestAnimationFrame: browsers pause it while
// the page is hidden, so it would never fire.
// (Rust shows the window anyway after a timeout, in case this never runs.)
if (isTauri()) void getCurrentWindow().show();
