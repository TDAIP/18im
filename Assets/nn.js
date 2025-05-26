(function() {
  if (document.getElementById('mt-browser-tool')) {
    // Remove existing toolbar if present
    const existingTool = document.getElementById('mt-browser-tool');
    existingTool.remove();
  }

  const container = document.createElement('div');
  container.id = 'mt-browser-tool';
  container.style = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(33, 33, 33, 0.95);
    color: white;
    padding: 8px 16px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  `;

  // Site info section (left)
  const siteInfo = document.createElement('div');
  siteInfo.style = `
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: background 0.2s ease;
  `;
  siteInfo.onmouseover = () => siteInfo.style.background = 'rgba(255, 255, 255, 0.1)';
  siteInfo.onmouseout = () => siteInfo.style.background = 'transparent';
  
  const favicon = document.createElement('img');
  favicon.src = 'https://www.google.com/s2/favicons?sz=32&domain=' + location.hostname;
  favicon.style = `
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border-radius: 4px;
    vertical-align: middle;
  `;

  // URL input field
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.value = location.href;
  urlInput.style = `
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    margin: 0 8px;
    width: 300px;
    font-size: 13px;
    transition: all 0.2s ease;
  `;
  urlInput.onfocus = () => urlInput.style.background = 'rgba(255, 255, 255, 0.15)';
  urlInput.onblur = () => urlInput.style.background = 'rgba(255, 255, 255, 0.1)';

  // Policy violation check
  const checkPolicyViolation = (text) => {
    const violations = ['zin'];
    for (const violation of violations) {
      if (text.toLowerCase().includes(violation)) {
        showPolicyAlert();
        return true;
      }
    }
    return false;
  };

  // Policy violation alert
  const showPolicyAlert = () => {
    const alert = document.createElement('div');
    alert.style = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #dc2626;
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 1000000;
      animation: fadeIn 0.3s ease;
    `;
    alert.innerHTML = `
      <h3 style="margin: 0 0 10px; font-size: 18px;">Policy Violation Warning</h3>
      <p style="margin: 0 0 15px;">This content violates vTinyGoly policies.</p>
      <button style="
        background: white;
        color: #dc2626;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    `;
    
    alert.querySelector('button').onclick = () => alert.remove();
    document.body.appendChild(alert);
  };

  // URL input handling
  urlInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      if (!checkPolicyViolation(urlInput.value)) {
        try {
          const url = urlInput.value.startsWith('http') ? urlInput.value : 'https://' + urlInput.value;
          window.location.href = url;
        } catch (err) {
          alert('Invalid URL');
        }
      }
    }
  };

  urlInput.oninput = (e) => {
    checkPolicyViolation(e.target.value);
  };

  // SSL indicator
  const sslIndicator = document.createElement('div');
  sslIndicator.style = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    background: ${location.protocol === 'https:' ? '#10B981' : '#F59E0B'};
  `;

  siteInfo.onclick = function() {
    alert(
      'Site Information:\n' +
      '- URL: ' + location.href + '\n' +
      '- Protocol: ' + location.protocol + '\n' +
      '- SSL: ' + (location.protocol === 'https:' ? 'Secure' : 'Not secure') + '\n' +
      '- Hostname: ' + location.hostname
    );
  };

  // Toolbar section (right)
  const toolbar = document.createElement('div');
  toolbar.style = 'display: flex; gap: 8px; margin-left: auto;';

  // Create toolbar buttons
  const buttons = [
    { text: 'Back', onClick: () => history.back() },
    { text: 'Forward', onClick: () => history.forward() },
    { text: 'Refresh', onClick: () => location.reload() },
    { text: 'Share', onClick: () => {
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: location.href
        }).catch(() => {
          alert('Share URL: ' + location.href);
        });
      } else {
        alert('Share URL: ' + location.href);
      }
    }}
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.style = `
      padding: 4px 12px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    `;
    button.onmouseover = () => button.style.background = 'rgba(255, 255, 255, 0.2)';
    button.onmouseout = () => button.style.background = 'rgba(255, 255, 255, 0.1)';
    button.onclick = btn.onClick;
    toolbar.appendChild(button);
  });

  // Add VTriP branding
  const branding = document.createElement('div');
  branding.style = `
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
  `;
  branding.textContent = 'Powered by VTriP Official';

  // Add styles for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -40%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
  `;
  document.head.appendChild(style);

  // Assemble the components
  siteInfo.appendChild(sslIndicator);
  siteInfo.appendChild(favicon);
  container.appendChild(siteInfo);
  container.appendChild(urlInput);
  container.appendChild(toolbar);
  container.appendChild(branding);

  // Add to page with animation
  document.body.appendChild(container);
  container.animate([
    { opacity: 0, transform: 'translate(-50%, 20px)' },
    { opacity: 1, transform: 'translate(-50%, 0)' }
  ], {
    duration: 300,
    easing: 'ease-out'
  });
})();
