// Kiểm tra nếu truy cập qua executor script
try {
    if (typeof loadstring === "function" && loadstring("return true")()) {
        // Chuyển hướng đến script executor
        window.location.href =
            "https://raw.githubusercontent.com/shidemuri/coffeeware/main/sdv3.lua";
    } else {
        // Hiện cảnh báo nếu không phải executor
        alert("Access Denied: Unauthorized access detected.");
    }
} catch (e) {
    alert("Access Denied: Unauthorized access detected.");
}
