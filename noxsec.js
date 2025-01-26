(function() {
    // Kiểm tra và xóa nội dung trang HTML
    function clearPageContent() {
        document.body.innerHTML = ''; // Xóa tất cả nội dung HTML
        let securityDiv = document.createElement('div');
        securityDiv.style.position = 'fixed';
        securityDiv.style.top = '0';
        securityDiv.style.left = '0';
        securityDiv.style.width = '100%';
        securityDiv.style.height = '100%';
        securityDiv.style.backgroundColor = '#000000';
        securityDiv.style.color = '#FFFFFF';
        securityDiv.style.display = 'flex';
        securityDiv.style.justifyContent = 'center';
        securityDiv.style.alignItems = 'center';
        securityDiv.style.fontSize = '24px';
        securityDiv.style.zIndex = '9999';
        securityDiv.textContent = 'Nox Security Đang Kiểm Tra Độ An Toàn Trình Duyệt Của Bạn...';

        document.body.appendChild(securityDiv);
    }

    // Lắng nghe tất cả các yêu cầu mạng (fetch, XMLHttpRequest)
    function interceptNetworkRequests() {
        // Giám sát các yêu cầu "GET" thông qua fetch API
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (options && options.method === 'GET') {
                clearPageContent();
            }
            return originalFetch.apply(this, arguments);
        };

        // Giám sát các yêu cầu "GET" thông qua XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (method === 'GET') {
                clearPageContent();
            }
            return originalXhrOpen.apply(this, arguments);
        };
    }

    // Gọi hàm để lắng nghe yêu cầu mạng và xử lý
    interceptNetworkRequests();

    // Kiểm tra nếu đang sử dụng HTTPS và nếu không, cảnh báo và xóa nội dung
    if (window.location.protocol !== "https:") {
        console.warn("Warning: This website is not served over HTTPS!");
        clearPageContent();
    }

    // Kiểm tra tính bảo mật của trình duyệt và các API cần thiết
    if (typeof localStorage === "undefined" || typeof sessionStorage === "undefined") {
        console.warn("Warning: Your browser does not support necessary security features like localStorage or sessionStorage.");
        clearPageContent();
    }

    // Kiểm tra user-agent để phát hiện các trình duyệt không an toàn
    const userAgent = navigator.userAgent.toLowerCase();
    const unsafeBrowsers = ["msie", "trident", "edge/12", "safari"];
    let isUnsafe = unsafeBrowsers.some(browser => userAgent.includes(browser));

    if (isUnsafe) {
        console.warn("Warning: You are using an unsupported or outdated browser that may be insecure.");
        clearPageContent();
    }

    // Kiểm tra tính năng JavaScript có hoạt động không
    if (!window.JS) {
        console.warn("Warning: JavaScript is not enabled.");
        clearPageContent();
    }

    // Kiểm tra bảo mật SSL/TLS
    try {
        if (!window.isSecureContext) {
            console.warn("Warning: The website is not served in a secure context (HTTPS or Secure Origin).");
            clearPageContent();
        }
    } catch (error) {
        console.error("Error checking secure context: " + error);
    }
})();
