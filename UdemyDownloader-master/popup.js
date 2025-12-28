document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
            showError("Unable to access the current tab.");
            return;
        }

        // Check if we're on a Udemy lecture page
        if (!tab.url || !tab.url.includes('udemy.com')) {
            showError("Please open a Udemy course video and try again.");
            return;
        }

        // Check if this is a lecture page (URL contains /learn/lecture/)
        const isLecturePage = tab.url.includes('/learn/lecture/');
        
        if (!isLecturePage) {
            showError("Please open a specific video lecture on Udemy.");
            return;
        }

        // Check if there's a video element on the page
        const videoCheck = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Check for video element
                const video = document.querySelector('video');
                if (video) return true;
                
                // Also check for video player containers
                const playerSelectors = [
                    '[data-purpose="video-player"]',
                    '.video-player',
                    '.vjs-tech',
                    '[class*="video-player"]',
                    '[class*="shaka-video"]'
                ];
                for (const selector of playerSelectors) {
                    if (document.querySelector(selector)) return true;
                }
                return false;
            }
        });

        if (!videoCheck || !videoCheck[0] || !videoCheck[0].result) {
            showError("No video found. Please wait for the video to load and try again.");
            return;
        }

        // Video found, show the UI
        showDownloadUI();

        // Get video title
        const titleResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Try multiple selectors for title
                const selectors = [
                    "[data-purpose='video-title']",
                    "[aria-current='true'] [data-purpose='item-title']",
                    "[aria-current='true'] .item-link",
                    ".curriculum-item-link--is-current span",
                    "[class*='video-viewer--title']",
                    "h1[class*='heading']",
                    "[data-purpose='safely-set-inner-html:video-title']"
                ];
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const text = element.getAttribute("aria-label") || element.textContent || element.innerText;
                        if (text && text.trim()) return text.trim();
                    }
                }
                // Fallback to document title - remove "| Udemy" suffix
                const docTitle = document.title.replace(/\s*\|\s*Udemy.*$/i, '').trim();
                return docTitle || "Udemy Video";
            }
        });

        if (titleResult && titleResult[0] && titleResult[0].result) {
            const title = sanitizeFilename(titleResult[0].result);
            document.querySelector(".title").textContent = title;
            document.querySelector('a').download = title + ".mp4";
        }

        // Get video duration
        const durationResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Try to get duration from video element first
                const video = document.querySelector('video');
                if (video && video.duration && !isNaN(video.duration)) {
                    const mins = Math.floor(video.duration / 60);
                    const secs = Math.floor(video.duration % 60);
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                }
                
                // Try multiple selectors for duration display
                const selectors = [
                    "[data-purpose='duration']",
                    "[data-purpose='video-progress-duration']",
                    ".vjs-duration-display",
                    ".vjs-remaining-time-display",
                    "[class*='video-viewer--current-time']",
                    "[class*='duration']"
                ];
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        return element.textContent.trim();
                    }
                }
                return "";
            }
        });

        if (durationResult && durationResult[0] && durationResult[0].result) {
            document.querySelector(".duration").textContent = durationResult[0].result;
        }

        // Get video source URL
        const videoSrcResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Try to find video element with src
                const videos = document.querySelectorAll('video');
                for (const video of videos) {
                    if (video.src && !video.src.startsWith('blob:')) {
                        return { url: video.src, type: 'direct' };
                    }
                    if (video.src && video.src.startsWith('blob:')) {
                        return { url: video.src, type: 'blob' };
                    }
                }
                
                // Try to get from source element
                const source = document.querySelector("video source");
                if (source && source.src) {
                    return { url: source.src, type: 'source' };
                }
                
                // Try to get currentSrc
                const video = document.querySelector('video');
                if (video && video.currentSrc) {
                    return { url: video.currentSrc, type: video.currentSrc.startsWith('blob:') ? 'blob' : 'direct' };
                }
                
                return null;
            }
        });

        if (videoSrcResult && videoSrcResult[0] && videoSrcResult[0].result) {
            const { url: videoUrl, type } = videoSrcResult[0].result;
            const anchor = document.querySelector('a');
            anchor.href = videoUrl;
            
            if (type === 'blob') {
                document.querySelector(".duration").textContent += " (Streaming - Right-click video to save)";
            }
            
            // Add click handler for download
            document.getElementById('download').addEventListener('click', function(e) {
                if (type === 'blob') {
                    e.preventDefault();
                    alert('This video uses streaming (blob URL). Right-click on the video in Udemy and select "Save video as..." to download.');
                }
            });
        } else {
            document.querySelector(".duration").textContent = "Video URL not found - try playing the video first";
        }

    } catch (error) {
        console.error("Error:", error);
        showError("An error occurred. Make sure you're on a Udemy video page.");
    }
});

function showError(message) {
    document.querySelector('.error').textContent = message;
    document.querySelector('.error').classList.remove('h');
    document.querySelectorAll('.title, .duration, .dl-container').forEach(el => el.classList.add('h'));
}

function showDownloadUI() {
    document.querySelector('.error').classList.add('h');
    document.querySelectorAll('.title, .duration, .dl-container').forEach(el => el.classList.remove('h'));
}

function sanitizeFilename(filename) {
    // Remove or replace characters that are invalid in filenames
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200); // Limit length
}
