document.addEventListener('DOMContentLoaded', () => {
    const createBoardButton = document.getElementById('create-board-button');
    const joinBoardButton = document.getElementById('join-board-button');
    const errorMessage = document.getElementById('error-message');

    const SERVERS_URL = 'https://im-a4c40-default-rtdb.asia-southeast1.firebasedatabase.app/com/WhiteArea/servers.json';

    createBoardButton.addEventListener('click', () => {
        // Tạo một Whiteboard mới
        fetch(SERVERS_URL, {
            method: 'POST',
            body: JSON.stringify({ created: new Date().toISOString() }),
        })
        .then(response => response.json())
        .then(data => {
            const boardId = data.name;
            window.location.href = `whiteboard.html?id=${boardId}`;
        })
        .catch(error => {
            console.error('Error creating whiteboard:', error);
        });
    });

    joinBoardButton.addEventListener('click', () => {
        // Tham gia một Whiteboard bằng ID
        const boardId = prompt('Enter Whiteboard ID:');
        if (boardId) {
            fetch(SERVERS_URL)
                .then(response => response.json())
                .then(data => {
                    if (data && data[boardId]) {
                        window.location.href = `whiteboard.html?id=${boardId}`;
                    } else {
                        errorMessage.classList.remove('hidden');
                        errorMessage.textContent = 'Whiteboard ID not found or banned';
                    }
                })
                .catch(error => {
                    console.error('Error checking whiteboard ID:', error);
                });
        }
    });
});
