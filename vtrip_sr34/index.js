const apiUrl = 'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=';

document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        const url = apiUrl + encodeURIComponent(query);
        try {
            const response = await fetch(url);
            const data = await response.json();

            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = '<p>An error occurred. Please try again later.</p>';
        }
    }

    function displayResults(data) {
        if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        resultsContainer.innerHTML = data.map(item => `
            <div class="result">
                <a href="${item.file_url}" target="_blank">
                    <img src="${item.preview_url}" alt="Image preview">
                </a>
                <p>Tags: ${item.tags}</p>
            </div>
        `).join('');
    }
});
