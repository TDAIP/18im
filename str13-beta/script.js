// Tạo bảng mã hóa tùy chỉnh ban đầu
const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890~!@#$%^&*()_+{}|:\"<>?-=[];',./";
const encodingCharacters = characters.split('');

// Hàm tạo bảng mã hóa nhiều tầng dựa vào key
function generateMultiLayerCipherKeys(key) {
    const hashedKey = advancedHash(key);  // Sử dụng hàm băm nâng cao
    const keyLength = key.length;
    let cipherKeys = [];

    for (let i = 0; i < keyLength; i++) {
        const subKey = hashedKey.slice(i, i + keyLength);
        let sortedSubKey = subKey.split('').sort().join('');
        let uniqueChars = Array.from(new Set(sortedSubKey));
        let cipherKey = [...uniqueChars];

        for (let char of encodingCharacters) {
            if (!cipherKey.includes(char)) {
                cipherKey.push(char);
            }
        }

        cipherKeys.push(cipherKey);
    }

    return cipherKeys;
}

// Hàm băm nâng cao từ key thành chuỗi
function advancedHash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31) + key.charCodeAt(i);  // Sử dụng phép nhân và cộng để băm
        hash ^= (hash >> 5);  // Sử dụng XOR và phép dịch bit để trộn
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16); // Sử dụng hex để có chuỗi dài hơn
}

// Hàm mã hóa với nhiều tầng mã hóa
function encrypt() {
    const input = document.getElementById('inputText').value;
    const key = document.getElementById('key').value;
    if (!input || !key) {
        alert("Vui lòng nhập văn bản và key để mã hóa!");
        return;
    }

    const cipherKeys = generateMultiLayerCipherKeys(key);
    let output = '';

    for (let i = 0; i < input.length; i++) {
        const currentChar = input[i];
        const indexInEncoding = characters.indexOf(currentChar);

        if (indexInEncoding === -1) {
            output += currentChar;
            continue;
        }

        const keyIndex = i % cipherKeys.length;
        const cipherKey = cipherKeys[keyIndex];
        const newIndex = (indexInEncoding + i + key.charCodeAt(i % key.length)) % cipherKey.length;
        output += cipherKey[newIndex];
    }

    document.getElementById('outputText').value = output;
}

// Hàm giải mã với nhiều tầng mã hóa
function decrypt() {
    const input = document.getElementById('inputText').value;
    const key = document.getElementById('key').value;
    if (!input || !key) {
        alert("Vui lòng nhập văn bản và key để giải mã!");
        return;
    }

    const cipherKeys = generateMultiLayerCipherKeys(key);
    let output = '';

    for (let i = 0; i < input.length; i++) {
        const currentChar = input[i];
        const keyIndex = i % cipherKeys.length;
        const cipherKey = cipherKeys[keyIndex];
        const indexInCipher = cipherKey.indexOf(currentChar);

        if (indexInCipher === -1) {
            output += currentChar;
            continue;
        }

        const newIndex = (indexInCipher - i - key.charCodeAt(i % key.length) + cipherKey.length) % cipherKey.length;
        output += characters[newIndex];
    }

    document.getElementById('outputText').value = output;
}
