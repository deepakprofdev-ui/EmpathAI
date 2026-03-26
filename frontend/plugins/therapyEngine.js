/**
 * EmpathAI Therapy Suggestion Engine Plugin
 * Dynamically injects Visual Therapy illustrations and exercise guidance based on emotional triggers.
 */

document.addEventListener('DOMContentLoaded', () => {
    const targetNode = document.getElementById('emotion-tips');
    if (!targetNode) return;

    // Observe changes to the emotion-tips wrapper to catch when chat.js populates it
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                setTimeout(injectTherapyEngine, 50); // Small delay to guarantee DOM stabilization
            }
        });
    });

    observer.observe(targetNode, { childList: true });
});

function injectTherapyEngine() {
    // 1. Check if we already injected to prevent duplication loops
    const existingPanel = document.getElementById('therapy-engine-panel');
    if (existingPanel) {
        existingPanel.remove(); // Clean up old one if emotion changed in same session
    }

    // 2. Determine Emotion and Intensity
    const nameNode = document.getElementById('emotion-result-name');
    if (!nameNode) return;
    
    const emotionLabel = nameNode.textContent.toLowerCase();
    
    // Map detected emotion to contextual image payload
    let imgName = '';
    let instruction = '';

    if (emotionLabel.includes('anxi') || emotionLabel.includes('panic') || emotionLabel.includes('stress') || emotionLabel.includes('overwhelmed') || emotionLabel.includes('pressure')) {
        imgName = 'therapy_breathing.png';
        instruction = 'Breathe in for 4s, Hold for 4s, Exhale for 6s.';
    } else if (emotionLabel.includes('overthink') || emotionLabel.includes('fear') || emotionLabel.includes('dissociat')) {
        imgName = 'therapy_grounding.png';
        instruction = 'Find 5 things you can see, 4 you can touch, 3 you can hear...';
    } else if (emotionLabel.includes('fatigue') || emotionLabel.includes('overload') || emotionLabel.includes('frustrat')) {
        imgName = 'therapy_meditation.png';
        instruction = 'Close your eyes. Focus only on the sound of the room.';
    } else if (emotionLabel.includes('sad') || emotionLabel.includes('low')) {
        imgName = 'therapy_gratitude.png';
        instruction = 'Reflect on one small good thing that happened today.';
    } else if (emotionLabel.includes('negative') || emotionLabel.includes('hopeless') || emotionLabel.includes('angry')) {
        imgName = 'therapy_cognitive.png';
        instruction = 'Visualize transferring this thought to a passing cloud.';
    } else if (emotionLabel.includes('crisis') || emotionLabel.includes('critical')) {
        imgName = 'therapy_crisis.png';
        instruction = 'You are in a safe space. Please take a moment to rest here. You are supported.';
    } else {
        // Exclude completely stable emotions like Neutral/Happy/Calm from triggering crisis intervention UX
        return;
    }

    // 3. Build the Dynamic Component Structure
    const panel = document.createElement('div');
    panel.id = 'therapy-engine-panel';
    // Structural isolation for the injected nodes ensuring Zero CSS contamination on the host
    panel.innerHTML = `
        <div style="margin: 20px 0; padding: 20px; background: rgba(0, 0, 0, 0.2); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: #9CA3AF; margin-bottom: 16px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-heartbeat"></i> Recommended Exercise
            </div>
            
            <!-- Dynamic Image Loader -->
            <div id="therapy-image-container" style="width: 100%; max-width: 280px; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.08);">
                <img src="assets/therapy/${imgName}" alt="Therapy Visualization Guidance" style="width: 100%; height: auto; display: block; object-fit: cover; opacity: 0.9;">
            </div>
            
            <!-- Visual Guidance Panel -->
            <div id="exercise-guidance-panel" style="font-size: 0.95rem; color: #E5E7EB; line-height: 1.6; padding: 0 10px; font-weight: 500;">
                <i class="ph ph-sparkle" style="color: #A78BFA; margin-right: 4px;"></i> ${instruction}
            </div>
        </div>
    `;

    // 4. Inject strictly between the modal title and the textual tips container
    const modalContent = document.querySelector('.emotion-result-card');
    const descContainer = document.getElementById('emotion-result-desc');
    
    if (modalContent && descContainer) {
        // Insert right after the description
        descContainer.parentNode.insertBefore(panel, descContainer.nextSibling);
    }
}
