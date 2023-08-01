import {exec} from "child_process"
import os from "os"
import fs from "fs"
import path from "path"

const addToStartup = () => {
    const backgroundJsPath = path.join(__dirname, 'background.js');

    // Detect the current platform
    const platform = os.platform();

    // Command to add the script to startup based on the platform
    let command = '';

    if (platform === 'darwin') {
        // macOS
        command = `osascript -e 'tell application "System Events" to make new login item at end with properties {path:"${backgroundJsPath}", hidden:false}'`;
    } else if (platform === 'win32') {
        // Windows
        command = `reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v "YourAppName" /t REG_SZ /d "${process.execPath} ${backgroundJsPath}"`;
    } else {
        // Linux (assuming you are using a desktop environment that supports autostart)
        const desktopEntryPath = path.join(
            process?.env?.HOME || "",
            '.config',
            'autostart',
            'your-app-name.desktop'
        );
        const desktopEntryContent = `[Desktop Entry]
Name=YourAppName
Exec=${process.execPath} ${backgroundJsPath}
Type=Application
X-GNOME-Autostart-enabled=true
`;
        fs.writeFileSync(desktopEntryPath, desktopEntryContent);
    }

    // Execute the command to add to startup
    exec(command, (error: any, stdout: any, stderr: any) => {
        if (error) {
            console.error('Failed to add to startup:', error);
        } else {
            console.log('Added to startup successfully.');
        }
    });
};

// Call the function to add to startup when the package is installed
addToStartup();
