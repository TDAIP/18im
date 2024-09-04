// Script cho main.html và whiteboard.html

// Các API endpoints
const API_BASE = 'https://im-a4c40-default-rtdb.asia-southeast1.firebasedatabase.app/com/WhiteArea';
const SERVERS_URL = `${API_BASE}/servers.json`;
const SERVER_URL = id => `${API_BASE}/server/${id}.json`;

// Main.js
document.addEventListener('DOMContentLoaded', () => {
    const createBoardButton = document.getElementById('create-board-button');
    const joinBoardButton = document.getElementById('join-board-button');
    const errorMessage = document.getElementById('error-message');

    createBoardButton.addEventListener('click', () => {
        fetch(SERVERS_URL, {
            method: 'POST',
            body: JSON.stringify({ created: new Date().toISOString() }),
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = `whiteboard.html?id=${data.name}`;
        })
        .catch(error => {
            console.error('Error creating whiteboard:', error);
        });
    });

    joinBoardButton.addEventListener('click', () => {
        const id = prompt('Enter Whiteboard ID:');
        if (id) {
            fetch(`${API_BASE}/servers.json`)
                .then(response => response.json())
                .then(data => {
                    if (data[id]) {
                        window.location.href = `whiteboard.html?id=${id}`;
                    } else {
                        errorMessage.classList.remove('hidden');
                    }
                })
                .catch(error => {
                    console.error('Error checking server:', error);
                });
        }
    });
});

// Whiteboard.js
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('whiteboard');
    const context = canvas.getContext('2d');
    const toolbarMore = document.getElementById('draw-toolbar-more');
    const optionsToolbarMore = document.getElementById('options-toolbar-more');
    const brushPreviewCanvas = document.createElement('canvas');
    const brushPreviewContext = brushPreviewCanvas.getContext('2d');
    const history = [];
    let historyIndex = -1;
    let drawing = false;
    let erasing = false;
    let currentColor = '#000000';
    let brushSize = document.getElementById('brush-size');
    
    // Load whiteboard ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('id');
    if (!boardId) {
        window.location.href = 'main.html';
        return;
    }

    // Canvas setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function saveState() {
        history.splice(historyIndex + 1);
        history.push(canvas.toDataURL());
        historyIndex++;
    }

    function restoreState(index) {
        const img = new Image();
        img.src = history[index];
        img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
        };
    }

    function startDrawing(event) {
        drawing = true;
        context.beginPath();
        context.moveTo(getClientX(event), getClientY(event));
    }

    function stopDrawing() {
        if (drawing) {
            drawing = false;
            context.closePath();
            saveState();
        }
    }

    function draw(event) {
        if (drawing) {
            context.lineWidth = brushSize.value;
            context.strokeStyle = currentColor;
            context.lineTo(getClientX(event), getClientY(event));
            context.stroke();
        }
        if (erasing) {
            context.clearRect(getClientX(event) - 10, getClientY(event) - 10, 20, 20);
        }
    }

    function getClientX(event) {
        return event.clientX - canvas.getBoundingClientRect().left;
    }

    function getClientY(event) {
        return event.clientY - canvas.getBoundingClientRect().top;
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
    }

    function updateBrushPreview() {
        brushPreviewContext.clearRect(0, 0, brushPreviewCanvas.width, brushPreviewCanvas.height);
        brushPreviewContext.strokeStyle = currentColor;
        brushPreviewContext.lineWidth = brushSize.value;
        brushPreviewContext.beginPath();
        brushPreviewContext.moveTo(10, 30);
        brushPreviewContext.quadraticCurveTo(30, 10, 50, 30);
        brushPreviewContext.stroke();
    }

    function toggleDrawToolbarMore() {
        toolbarMore.classList.toggle('hidden');
        optionsToolbarMore.classList.add('hidden');
    }

    function toggleOptionsToolbarMore() {
        optionsToolbarMore.classList.toggle('hidden');
        toolbarMore.classList.add('hidden');
    }

    function updateBasicColors() {
        // Hardcoded basic colors for demonstration
        const basicColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const basicColorsDiv = document.getElementById('basic-colors');
        basicColorsDiv.innerHTML = '';
        basicColors.forEach(color => {
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'color-swatch';
            colorSwatch.style.backgroundColor = color;
            colorSwatch.addEventListener('click', () => {
                currentColor = color;
                updateBrushPreview();
            });
            basicColorsDiv.appendChild(colorSwatch);
        });
    }

    function addCustomColor() {
        const color = prompt('Enter a color code (RGB, HEX, etc.):');
        if (color) {
            basicColors.push(color);
            updateBasicColors();
        }
    }

    function addText() {
        const text = prompt('Enter the text you want to add:');
        if (text) {
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            context.font = '16px Arial';
            context.fillStyle = currentColor;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, x, y);
            saveState();
        }
    }

    function addPic() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = function() {
                        const x = canvas.width / 2 - img.width / 2;
                        const y = canvas.height / 2 - img.height / 2;
                        context.drawImage(img, x, y);
                        saveState();
                    };
                };
                reader.readAsDataURL(file);
            }
        });
        fileInput.click();
    }

    function handleTouchZoom(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            // Xử lý zoom và di chuyển ở đây
        }
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreState(historyIndex);
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            restoreState(historyIndex);
        }
    }

    function startErasing(event) {
        erasing = true;
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.moveTo(getClientX(event), getClientY(event));
    }

    function stopErasing() {
        if (erasing) {
            erasing = false;
            context.closePath();
            saveState();
            context.globalCompositeOperation = 'source-over';
        }
    }

    // Xử lý các sự kiện
    canvas.addEventListener('mousedown', (e) => {
        if (eraseButton.classList.contains('active')) {
            startErasing(e);
        } else {
            startDrawing(e);
        }
    });
    canvas.addEventListener('mouseup', () => {
        if (eraseButton.classList.contains('active')) {
            stopErasing();
        } else {
            stopDrawing();
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (eraseButton.classList.contains('active')) {
            draw(e);
        } else {
            draw(e);
        }
    });
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (eraseButton.classList.contains('active')) {
            startErasing(e.touches[0]);
        } else {
            startDrawing(e.touches[0]);
        }
    });
    canvas.addEventListener('touchend', () => {
        if (eraseButton.classList.contains('active')) {
            stopErasing();
        } else {
            stopDrawing();
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (eraseButton.classList.contains('active')) {
            draw(e.touches[0]);
        } else {
            draw(e.touches[0]);
        }
    });
    canvas.addEventListener('touchmove', handleTouchZoom);

    document.getElementById('draw-button').addEventListener('click', toggleDrawToolbarMore);
    document.getElementById('options-button').addEventListener('click', toggleOptionsToolbarMore);
    document.getElementById('clear-button').addEventListener('click', clearCanvas);
    document.getElementById('brush-size').addEventListener('input', updateBrushPreview);
    document.getElementById('add-color-button').addEventListener('click', addCustomColor);
    document.getElementById('add-text-button').addEventListener('click', addText);
    document.getElementById('add-pic-button').addEventListener('click', addPic);
    document.getElementById('undo-button').addEventListener('click', undo);
    document.getElementById('redo-button').addEventListener('click', redo);
    document.getElementById('erase-button').addEventListener('click', (e) => {
        e.target.classList.toggle('active');
        if (e.target.classList.contains('active')) {
            eraseButton.classList.add('active');
        } else {
            eraseButton.classList.remove('active');
        }
    });
    document.getElementById('download-button').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = 'whiteboard.png';
        link.click();
    });

    updateBasicColors();
    updateBrushPreview();
});
