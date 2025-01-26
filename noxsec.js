(function() {
    
    // Xóa tất cả nội dung và hiển thị giao diện bảo mật
    function showSecurityInterface() {
        // Xóa tất cả nội dung HTML
        document.body.innerHTML = '';

        // Tạo div hiển thị giao diện bảo mật
        let securityDiv = document.createElement('div');
        securityDiv.style.position = 'fixed';
        securityDiv.style.top = '0';
        securityDiv.style.left = '0';
        securityDiv.style.width = '100%';
        securityDiv.style.height = '100%';
        securityDiv.style.backgroundColor = '#202332'; // Màu nền tối
        securityDiv.style.color = '#FF4444'; // Màu chữ sáng
        securityDiv.style.display = 'flex';
        securityDiv.style.justifyContent = 'center';
        securityDiv.style.alignItems = 'center';
        securityDiv.style.fontSize = '32px';
        securityDiv.style.zIndex = '9999';
        securityDiv.style.textAlign = 'center';
        securityDiv.style.fontFamily = 'Arial, sans-serif';
        securityDiv.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
        securityDiv.style.animation = 'fadeIn 1s ease-out';

        // Thêm văn bản vào giao diện
        securityDiv.innerHTML = `
            <div>
                <div style="font-size: 48px; font-weight: bold;">Nox Security</div>
                <div>Đang Kiểm Tra Độ An Toàn Trình Duyệt Của Bạn...</div>
                <div style="margin-top: 20px; font-size: 20px;">Vui lòng chờ...</div>
            </div>
        `;

        // Thêm logo nếu cần
        let logoImg = document.createElement('img');
        logoImg.src = 'https://example.com/logo.png';  // Cập nhật đường dẫn logo nếu cần
        logoImg.style.width = '100px';
        logoImg.style.marginTop = '20px';
        securityDiv.appendChild(logoImg);

        // Thêm giao diện bảo mật vào body
        document.body.appendChild(securityDiv);
    }

    // Lắng nghe và chặn tất cả các yêu cầu mạng (GET, POST, XHR, fetch)
    function interceptNetworkRequests() {
        // Giám sát các yêu cầu "GET" thông qua fetch API
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (options && options.method === 'GET') {
                showSecurityInterface();
            }
            return originalFetch.apply(this, arguments);
        };

        // Giám sát các yêu cầu "GET" thông qua XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (method === 'GET') {
                showSecurityInterface();
            }
            return originalXhrOpen.apply(this, arguments);
        };
    }

    // Kiểm tra nếu trang web đang được mở trong iframe
    if (window !== window.top) {
        showSecurityInterface();
    }

    // Gọi hàm để lắng nghe yêu cầu mạng và xử lý
    interceptNetworkRequests();

    // Kiểm tra nếu đang sử dụng HTTPS và nếu không, hiển thị giao diện bảo mật
    if (window.location.protocol !== "https:") {
        console.warn("Warning: This website is not served over HTTPS!");
        showSecurityInterface();
    }

    // Kiểm tra tính bảo mật của trình duyệt và các API cần thiết
    if (typeof localStorage === "undefined" || typeof sessionStorage === "undefined") {
        console.warn("Warning: Your browser does not support necessary security features like localStorage or sessionStorage.");
        showSecurityInterface();
    }

    // Kiểm tra user-agent để phát hiện các trình duyệt không an toàn
    const userAgent = navigator.userAgent.toLowerCase();
    const unsafeBrowsers = ["msie", "trident", "edge/12", "safari"];
    let isUnsafe = unsafeBrowsers.some(browser => userAgent.includes(browser));

    if (isUnsafe) {
        console.warn("Warning: You are using an unsupported or outdated browser that may be insecure.");
        showSecurityInterface();
    }

    // Kiểm tra tính năng JavaScript có hoạt động không
    if (!window.JS) {
        console.warn("Warning: JavaScript is not enabled.");
        showSecurityInterface();
    }

    // Kiểm tra bảo mật SSL/TLS
    try {
        if (!window.isSecureContext) {
            console.warn("Warning: The website is not served in a secure context (HTTPS or Secure Origin).");
            showSecurityInterface();
        }
    } catch (error) {
        console.error("Error checking secure context: " + error);
        showSecurityInterface();
    }
})();
