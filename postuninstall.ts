import {exec} from "child_process"
import os from "os"
import fs from "fs"
import path from "path"

const removeFromStartup = () => {
    // Detect the current platform
    const platform = os.platform();

    // Command to remove the script from startup based on the platform
    let command = '';

    if (platform === 'darwin') {
        // macOS
        command = `osascript -e 'tell application "System Events" to delete login item "YourAppName"'`;
    } else if (platform === 'win32') {
        // Windows
        command = 'reg delete HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v "YourAppName" /f';
    } else {
        // Linux (assuming you are using a desktop environment that supports autostart)
        const desktopEntryPath = path.join(
            process?.env?.HOME || "",
            '.config',
            'autostart',
            'your-app-name.desktop'
        );

        // Remove the desktop entry file
        try {
            fs.unlinkSync(desktopEntryPath);
            console.log('Removed from startup successfully.');
        } catch (error) {
            console.error('Failed to remove from startup:', error);
        }
    }

    // Execute the command to remove from startup
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to remove from startup:', error);
        } else {
            console.log('Removed from startup successfully.');
        }
    });
};

// Call the function to remove from startup when the package is uninstalled
removeFromStartup();
