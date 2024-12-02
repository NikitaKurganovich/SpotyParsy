const linkField = document.getElementById("link-field");
const tokenField = document.getElementById("access-token");

document.getElementById("download-button").addEventListener("click", tryDownload);

linkField.addEventListener("input", clearError);
tokenField.addEventListener("input", clearError);

let preloadedTracks = [];

async function loadCSVFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error('Failed to load CSV file');
        }
        const csv = await response.text();
        preloadedTracks = parseCSV(csv);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

loadCSVFile('scripts/features.csv');

async function tryDownload() {
    const playlistId = parsePlaylistId(linkField.value);
    if (!playlistId) {
        showError("Invalid Spotify playlist link");
        return;
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenField.value}` }
        });
        if (!response.ok) {
            throw new Error('Invalid access token');
        }
        const data = await response.json();
        const csvContent = generateCSV(data);
        downloadCSV(csvContent, `${data.name}.csv`);
    } catch (error) {
        console.error('Error:', error);
        showError(tokenField, error.message);
    }
}

function parsePlaylistId(link) {
    const regex = /https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)(\?.*)?/;
    const match = link.match(regex);
    return match ? match[1] : null;
}

function showError(field, message) {
    field.setAttribute("error");
    field.setAttribute("error-text", message);
}

function clearError(event) {
    const field = event.target;
    field.removeAttribute("error");
    field.removeAttribute("error-text");
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const track = {};
        headers.forEach((header, index) => {
            track[header] = values[index];
        });
        return track;
    });
}

function generateCSV(data) {
    const tracks = data.tracks.items.map(item => item.track);
    const csvLines = ['description,acousticness,danceability,energy,instrumentalness,key,liveness,loudness,mode,speechiness,tempo,time_signature,valence'];

    for (const trackData of tracks) {
        const features = preloadedTracks.find(track => {
            return track.track_id === trackData.id ||
                (track.track_name === trackData.name && trackData.artists.map(artist => artist.name).includes(track.artist_name));
        });

        if (features) {
            csvLines.push([
                data.name,
                features.acousticness,
                features.danceability,
                features.energy,
                features.instrumentalness,
                features.key,
                features.liveness,
                features.loudness,
                features.mode,
                features.speechiness,
                features.tempo,
                features.time_signature,
                features.valence
            ].join(', '));
        }
    }
    return csvLines.join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
