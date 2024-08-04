function display404() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `
        <h1>404 - No Results Found</h1>
        <p>Sorry, we couldn't find any results for your search.</p>
        <a href="index.html">Go back to the homepage</a>
    `;
}

async function search() {
    const query = document.getElementById('searchQuery').value;

    // Kiểm tra nếu từ khóa tìm kiếm
    const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.length) {
            display404();  // Hiển thị trang lỗi 404 tùy chỉnh
            return;
        }

        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        data.forEach(post => {
            const imgElement = document.createElement('img');
            imgElement.src = post.file_url;
            imgElement.alt = post.tags;
            imgElement.className = 'result-item';

            resultsContainer.appendChild(imgElement);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        display404();  // Hiển thị trang lỗi 404 nếu có lỗi
    }
}
