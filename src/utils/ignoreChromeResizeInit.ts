// Side-effect module: imported first in main.tsx so the capture listener is
// registered before any other module's `resize` listener.
import { installIgnoreChromeResize } from './ignoreChromeResize';

installIgnoreChromeResize();
