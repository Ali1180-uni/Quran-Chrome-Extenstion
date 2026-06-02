// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // --- Tab Switching Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            if (btn.dataset.target === 'saved-panel') loadCapsules();
        });
    });

    // --- Extraction Logic ---
    const extractBtn = document.getElementById('extract-btn');
    const editorContainer = document.getElementById('editor-container');
    const markdownEditor = document.getElementById('markdown-editor');
    const saveCapsuleBtn = document.getElementById('save-capsule-btn');

    extractBtn.addEventListener('click', async () => {
        extractBtn.innerText = "Extracting...";
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute the scraping function in the context of the webpage
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeChatContext
            });

            const rawMarkdown = results[0].result;
            markdownEditor.value = rawMarkdown;
            extractBtn.style.display = 'none';
            editorContainer.style.display = 'block';
        } catch (err) {
            alert("Error extracting chat. Ensure you are on an active web page.");
            extractBtn.innerText = "Extract Chat from Current Tab";
        }
    });

    // --- Save Logic ---
    saveCapsuleBtn.addEventListener('click', async () => {
        const rawContent = markdownEditor.value.trim();
        if (!rawContent) return;

        // Wrap the content in the Capsule Prompt format
        const finalCapsule = `# [CONTEXT CAPSULE]\n*System Instruction: The following is a compressed summary/context of a previous conversation. Please ingest this context, acknowledge you have read it, and wait for my next prompt.*\n\n---\n${rawContent}\n---`;

        const newCapsule = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            content: finalCapsule
        };

        chrome.storage.local.get(['capsules'], (result) => {
            const capsules = result.capsules || [];
            capsules.unshift(newCapsule); // Add to beginning
            chrome.storage.local.set({ capsules }, () => {
                // Reset UI and switch tabs
                markdownEditor.value = '';
                editorContainer.style.display = 'none';
                extractBtn.style.display = 'block';
                extractBtn.innerText = "Extract Chat from Current Tab";
                document.querySelector('[data-target="saved-panel"]').click();
            });
        });
    });
});

// --- Storage & Rendering Logic ---
function loadCapsules() {
    const listContainer = document.getElementById('capsules-list');
    const emptyState = document.getElementById('empty-state');
    
    chrome.storage.local.get(['capsules'], (result) => {
        const capsules = result.capsules || [];
        listContainer.innerHTML = '';
        
        if (capsules.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        capsules.forEach(capsule => {
            const div = document.createElement('div');
            div.className = 'capsule-item';
            
            // Preview calculation
            const previewText = capsule.content.substring(0, 100).replace(/\n/g, ' ') + '...';

            div.innerHTML = `
                <div class="capsule-header">
                    <span>📅 ${capsule.date}</span>
                    <div class="capsule-actions">
                        <button class="btn-small copy-btn" data-content="${encodeURIComponent(capsule.content)}">Copy</button>
                        <button class="btn-small delete delete-btn" data-id="${capsule.id}">Del</button>
                    </div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text); opacity: 0.8;">
                    ${previewText}
                </div>
            `;
            listContainer.appendChild(div);
        });

        // Attach listeners to dynamic buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const content = decodeURIComponent(e.target.dataset.content);
                navigator.clipboard.writeText(content).then(() => {
                    const originalText = e.target.innerText;
                    e.target.innerText = 'Copied!';
                    setTimeout(() => e.target.innerText = originalText, 1500);
                });
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteCapsule(id);
            });
        });
    });
}

function deleteCapsule(id) {
    chrome.storage.local.get(['capsules'], (result) => {
        let capsules = result.capsules || [];
        capsules = capsules.filter(c => c.id !== id);
        chrome.storage.local.set({ capsules }, loadCapsules);
    });
}

// --- Injected Content Script Algorithm ---
// Note: This function executes inside the target webpage DOM, not the extension popup.
function scrapeChatContext() {
    let context = "";
    
    // Strategy 1: OpenAI ChatGPT Structure Match
    const gptMessages = document.querySelectorAll('div[data-message-author-role]');
    if (gptMessages.length > 0) {
        gptMessages.forEach(msg => {
            const role = msg.getAttribute('data-message-author-role');
            context += `**${role.toUpperCase()}**: ${msg.innerText.trim()}\n\n`;
        });
        return context;
    }

    // Strategy 2: Generic Semantic HTML Match (Claude/Gemini/Others)
    // Looking for repeating conversational blocks.
    const genericBlocks = document.querySelectorAll('article, .message, .prose, [class*="message"]');
    if (genericBlocks.length > 3) {
        genericBlocks.forEach((block, index) => {
            const role = index % 2 === 0 ? "USER" : "ASSISTANT";
            if (block.innerText.trim().length > 0) {
                 context += `**${role}**: ${block.innerText.trim()}\n\n`;
            }
        });
        return context;
    }

    // Strategy 3: Bruteforce Document Extraction fallback
    const paragraphs = document.querySelectorAll('p, pre, code');
    paragraphs.forEach(p => {
        if(p.innerText.trim()) {
            context += p.innerText.trim() + "\n\n";
        }
    });

    return context || document.body.innerText.substring(0, 10000); // Failsafe text dump
}