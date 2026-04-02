const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow = null;
let serverProcess = null;
const PORT = 3099;

// Find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Wait for the server to be ready
function waitForServer(port, retries = 60) {
  return new Promise((resolve, reject) => {
    const tryConnect = (remaining) => {
      if (remaining <= 0) {
        reject(new Error('Server failed to start'));
        return;
      }
      const client = net.createConnection({ port }, () => {
        client.end();
        resolve();
      });
      client.on('error', () => {
        setTimeout(() => tryConnect(remaining - 1), 500);
      });
    };
    tryConnect(retries);
  });
}

// Start the Next.js production server
async function startServer(port) {
  const isProd = app.isPackaged;
  const appPath = isProd
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..');

  // Use the Next.js start command
  const nextBin = isProd
    ? path.join(appPath, 'node_modules', '.bin', 'next')
    : path.join(appPath, 'node_modules', '.bin', 'next');

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
  };

  serverProcess = spawn(nextBin, ['start', '-p', String(port)], {
    cwd: appPath,
    env,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`);
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  await waitForServer(port);
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'PDF 編輯器',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Build a simple menu
  const template = [
    {
      label: '檔案',
      submenu: [
        {
          label: '開啟 PDF',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'PDF', extensions: ['pdf'] }],
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths[0]) {
              // Send file path to renderer
              mainWindow.webContents.executeJavaScript(`
                fetch("${result.filePaths[0].replace(/\\/g, '/')}").catch(() => null);
              `);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit', label: '結束' },
      ],
    },
    {
      label: '編輯',
      submenu: [
        { role: 'undo', label: '復原' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪下' },
        { role: 'copy', label: '複製' },
        { role: 'paste', label: '貼上' },
      ],
    },
    {
      label: '檢視',
      submenu: [
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '縮小' },
        { role: 'resetZoom', label: '重設縮放' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全螢幕' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  mainWindow.loadURL(`http://localhost:${port}/pdf-editor`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    const port = await findAvailablePort(PORT);
    await startServer(port);
    createWindow(port);
  } catch (err) {
    console.error('Startup failed:', err);
    dialog.showErrorBox('啟動失敗', `無法啟動應用程式: ${err.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    findAvailablePort(PORT).then((port) => createWindow(port));
  }
});
