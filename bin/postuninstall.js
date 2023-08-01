"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const removeFromStartup = () => {
    var _a;
    // Detect the current platform
    const platform = os_1.default.platform();
    // Command to remove the script from startup based on the platform
    let command = '';
    if (platform === 'darwin') {
        // macOS
        command = `osascript -e 'tell application "System Events" to delete login item "YourAppName"'`;
    }
    else if (platform === 'win32') {
        // Windows
        command = 'reg delete HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v "YourAppName" /f';
    }
    else {
        // Linux (assuming you are using a desktop environment that supports autostart)
        const desktopEntryPath = path_1.default.join(((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.HOME) || "", '.config', 'autostart', 'your-app-name.desktop');
        // Remove the desktop entry file
        try {
            fs_1.default.unlinkSync(desktopEntryPath);
            console.log('Removed from startup successfully.');
        }
        catch (error) {
            console.error('Failed to remove from startup:', error);
        }
    }
    // Execute the command to remove from startup
    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to remove from startup:', error);
        }
        else {
            console.log('Removed from startup successfully.');
        }
    });
};
// Call the function to remove from startup when the package is uninstalled
removeFromStartup();
//# sourceMappingURL=postuninstall.js.map