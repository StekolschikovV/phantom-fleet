"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const addToStartup = () => {
    var _a;
    const backgroundJsPath = path_1.default.join(__dirname, 'background.js');
    // Detect the current platform
    const platform = os_1.default.platform();
    // Command to add the script to startup based on the platform
    let command = '';
    if (platform === 'darwin') {
        // macOS
        command = `osascript -e 'tell application "System Events" to make new login item at end with properties {path:"${backgroundJsPath}", hidden:false}'`;
    }
    else if (platform === 'win32') {
        // Windows
        command = `reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v "YourAppName" /t REG_SZ /d "${process.execPath} ${backgroundJsPath}"`;
    }
    else {
        // Linux (assuming you are using a desktop environment that supports autostart)
        const desktopEntryPath = path_1.default.join(((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.HOME) || "", '.config', 'autostart', 'your-app-name.desktop');
        const desktopEntryContent = `[Desktop Entry]
Name=YourAppName
Exec=${process.execPath} ${backgroundJsPath}
Type=Application
X-GNOME-Autostart-enabled=true
`;
        fs_1.default.writeFileSync(desktopEntryPath, desktopEntryContent);
    }
    // Execute the command to add to startup
    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to add to startup:', error);
        }
        else {
            console.log('Added to startup successfully.');
        }
    });
};
// Call the function to add to startup when the package is installed
addToStartup();
//# sourceMappingURL=postinstall.js.map