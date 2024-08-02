const apiUrl = 'https://im-a4c40-default-rtdb.asia-southeast1.firebasedatabase.app/accounts.json';
const storageUrl = 'https://firebasestorage.googleapis.com/v0/b/im-a4c40.appspot.com/o/';

function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('loggedInUser'));
}

async function loadProfile() {
    const username = getQueryParameter('username');
    const loggedInUser = getLoggedInUser();

    if (!username) {
        alert('No username provided.');
        return;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const account = Object.values(data).find(acc => acc.username === username);

        if (!account) {
            document.getElementById('profile').innerHTML = '<p>User not found.</p>';
            return;
        }

        const userDetails = document.getElementById('userDetails');
        userDetails.innerHTML = `
            <p><strong>Username:</strong> ${account.username}</p>
            <p><strong>Name:</strong> ${account.name}</p>
            <p><strong>Email:</strong> ${account.email || 'N/A'}</p>
            <p><strong>Followers:</strong> ${account.Follower || 0}</p>
            <p><strong>Following:</strong> ${account.Following || 0}</p>
            <p><strong>Likes My Posts:</strong> ${account['likes-my-post'] || 0}</p>
            <img src="${storageUrl}${account.avatar}?alt=media" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%;">
        `;

        if (loggedInUser) {
            if (loggedInUser.username === username) {
                document.getElementById('settings').style.display = 'block';
                document.getElementById('settingsForm').addEventListener('submit', saveChanges);
                document.getElementById('deleteAccount').addEventListener('click', deleteAccount);
            } else {
                document.getElementById('followContainer').style.display = 'block';
                document.getElementById('followButton').addEventListener('click', toggleFollow);
                await loadFollowersAndFollowing(username);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('profile').innerHTML = '<p>An error occurred. Please try again later.</p>';
    }
}

async function loadFollowersAndFollowing(username) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const account = Object.values(data).find(acc => acc.username === username);

        if (account) {
            const followersList = document.getElementById('followers');
            const followingList = document.getElementById('following');
            const followers = account['who-follow'] ? account['who-follow'].split(', ') : [];
            const following = account['Following'] ? account['Following'].split(', ') : [];

            followersList.innerHTML = followers.map(follower => `<li>${follower}</li>`).join('');
            followingList.innerHTML = following.map(followed => `<li>${followed}</li>`).join('');

            if (followers.length > 0) {
                document.getElementById('followersList').style.display = 'block';
            }
            if (following.length > 0) {
                document.getElementById('followingList').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading followers and following.');
    }
}

async function toggleFollow() {
    const username = getQueryParameter('username');
    const loggedInUser = getLoggedInUser();

    if (!username || !loggedInUser) {
        alert('Unauthorized action.');
        return;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const loggedInAccountKey = Object.keys(data).find(key => data[key].username === loggedInUser.username);
        const targetAccountKey = Object.keys(data).find(key => data[key].username === username);

        if (!loggedInAccountKey || !targetAccountKey) {
            alert('Account not found.');
            return;
        }

        const loggedInAccount = data[loggedInAccountKey];
        const targetAccount = data[targetAccountKey];

        let updatedWhoFollow = [];
        if (targetAccount['who-follow'] && targetAccount['who-follow'].split(', ').includes(loggedInUser.username)) {
            // Unfollow
            updatedWhoFollow = targetAccount['who-follow'].split(', ').filter(followed => followed !== loggedInUser.username);
        } else {
            // Follow
            updatedWhoFollow = targetAccount['who-follow'] ? [...targetAccount['who-follow'].split(', '), loggedInUser.username] : [loggedInUser.username];
        }

        const updates = {
            [`/${targetAccountKey}/who-follow`]: updatedWhoFollow.join(', ')
        };

        await fetch(apiUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        alert('Follow status updated!');
        loadProfile(); // Reload profile to update follow status
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating follow status.');
    }
}

async function saveChanges(event) {
    event.preventDefault();

    const username = getQueryParameter('username');
    const loggedInUser = getLoggedInUser();

    if (!username || !loggedInUser || loggedInUser.username !== username) {
        alert('Unauthorized action.');
        return;
    }

    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const avatarFile = document.getElementById('avatarInput').files[0];

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const accountKey = Object.keys(data).find(key => data[key].username === username);

        if (!accountKey) {
            alert('Account not found.');
            return;
        }

        const updates = {};
        if (name) updates[`/${accountKey}/name`] = name;
        if (email) updates[`/${accountKey}/email`] = email;
        if (password) updates[`/${accountKey}/password`] = password;

        if (avatarFile) {
            const storageRef = firebase.storage().ref();
            const avatarRef = storageRef.child('avatars/' + avatarFile.name);
            await avatarRef.put(avatarFile);
            const avatarUrl = await avatarRef.getDownloadURL();
            updates[`/${accountKey}/avatar`] = avatarUrl.split('/o/')[1].split('?')[0]; // Extract the file path
        }

        await fetch(apiUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        alert('Changes saved successfully!');
        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving changes.');
    }
}

async function deleteAccount() {
    const username = getQueryParameter('username');
    const loggedInUser = getLoggedInUser();

    if (!username || !loggedInUser || loggedInUser.username !== username) {
        alert('Unauthorized action.');
        return;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const accountKey = Object.keys(data).find(key => data[key].username === username);

        if (!accountKey) {
            alert('Account not found.');
            return;
        }

        await fetch(apiUrl + '/' + accountKey + '.json', {
            method: 'DELETE'
        });

        alert('Account deleted successfully!');
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html'; // Redirect to login page
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while deleting the account.');
    }
}

document.addEventListener('DOMContentLoaded', loadProfile);
            
