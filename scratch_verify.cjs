const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--window-size=1600,950',
  'http://localhost:5173'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('5173')) || tabs[0];

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 11,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const mapEl = document.querySelector('.leaflet-container');
              const header = document.querySelector('header');
              const authBtn = document.querySelector('header button');
              return {
                hasLeaflet: !!mapEl,
                mapRect: mapEl ? {
                  width: mapEl.getBoundingClientRect().width,
                  height: mapEl.getBoundingClientRect().height
                } : null,
                headerText: header ? header.innerText.replace(/\\n/g, ' ') : null,
                localStorageUser: localStorage.getItem('campus_connect_active_user_v1')
              };
            })()`,
            returnByValue: true
          }
        }));

        ws.send(JSON.stringify({
          id: 12,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 3500);
    });

    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg);
      if (parsed.id === 11) {
        console.log('VERIFY DETAILS:', JSON.stringify(parsed.result.result.value, null, 2));
      }
      if (parsed.id === 12 && parsed.result && parsed.result.data) {
        fs.writeFileSync('verify_map.png', Buffer.from(parsed.result.data, 'base64'));
        console.log('Saved verify_map.png');
      }
    });

    setTimeout(() => {
      ws.close();
      proc.kill();
      process.exit(0);
    }, 6000);
  } catch (err) {
    console.error('Error:', err);
    proc.kill();
    process.exit(1);
  }
}, 1500);
