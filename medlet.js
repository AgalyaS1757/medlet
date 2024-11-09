const medicineDatabase = {
    "acetaminophen": {
        "uses": "Pain relief, fever reduction",
        "effects": "Reduces fever and relieves mild to moderate pain",
        "side_effects": ["Liver damage with overuse", "Allergic reactions"],
        "age_limitation": "Not recommended for children under 2 years",
        "duration": "As needed, typically not more than 3 days",
        "cost": "₹100 - ₹300 (for generic tablets)",
        "dosage": {
            "children_2_6": "160 mg every 4-6 hours (max 5 doses/day)",
            "children_6_12": "325 mg every 4-6 hours (max 5 doses/day)",
            "adults": "500 mg every 4-6 hours (max 3000 mg/day)"
        },
        "patterns": {
            "colors": ["white", "off-white"],
            "shapes": ["round", "oval"],
            "markings": ["TYLENOL", "APAP", "500", "325"]
        }
    },
    "aspirin": {
        "uses": "Pain relief, anti-inflammatory, fever reduction",
        "effects": "Reduces pain, inflammation, and fever",
        "side_effects": ["Gastrointestinal bleeding", "Allergic reactions", "Tinnitus"],
        "age_limitation": "Not recommended for children under 12 years",
        "duration": "As needed, typically not more than 10 days",
        "cost": "₹50 - ₹200 (for generic tablets)",
        "dosage": {
            "children_12_16": "81 mg daily",
            "adults": "325 mg every 4-6 hours (max 4000 mg/day)"
        },
        "patterns": {
            "colors": ["white", "off-white"],
            "shapes": ["round"],
            "markings": ["ASPIRIN", "ASA", "81", "325"]
        }
    }
};

// DOM Elements
const loginSection = document.getElementById('loginSection');
const searchSection = document.getElementById('searchSection');
const usernameInput = document.getElementById('usernameInput');
const usernameDisplay = document.getElementById('usernameDisplay');
const loginBtn = document.getElementById('loginBtn');
const guestBtn = document.getElementById('guestBtn');
const logoutBtn = document.getElementById('logoutBtn');
const searchBtn = document.getElementById('searchBtn');
const uploadBtn = document.getElementById('uploadBtn');
const tabletNameInput = document.getElementById('tabletName');
const tabletImageInput = document.getElementById('tabletImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const resultsSection = document.getElementById('resultsSection');
const tabletDetails = document.getElementById('tabletDetails');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
guestBtn.addEventListener('click', handleGuestLogin);
logoutBtn.addEventListener('click', handleLogout);
searchBtn.addEventListener('click', handleSearch);
uploadBtn.addEventListener('click', handleImageUpload);
tabletImageInput.addEventListener('change', handleImagePreview);

// Check login status on page load
checkLoginStatus();

// Functions
function checkLoginStatus() {
    const username = localStorage.getItem('username');
    if (username) {
        showLoggedInState(username);
    } else {
        showLoggedOutState();
    }
}

function showLoggedInState(username) {
    loginSection.classList.add('hidden');
    searchSection.classList.remove('hidden');
    usernameDisplay.textContent = username;
}

function showLoggedOutState() {
    loginSection.classList.remove('hidden');
    searchSection.classList.add('hidden');
    usernameDisplay.textContent = 'Guest';
}

function handleLogin() {
    const username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('username', username);
        showLoggedInState(username);
    } else {
        showError('Please enter a username');
    }
}

function handleGuestLogin() {
    localStorage.setItem('username', 'Guest');
    showLoggedInState('Guest');
}

function handleLogout() {
    localStorage.removeItem('username');
    showLoggedOutState();
    resetSearch();
}

function handleSearch() {
    const tabletName = tabletNameInput.value.trim().toLowerCase();
    const tabletInfo = medicineDatabase[tabletName];
    
    if (tabletInfo) {
        displayTabletDetails(tabletName, tabletInfo);
    } else {
        showError('Tablet not found. Please check the name.');
    }
}

async function handleImageUpload() {
    const file = tabletImageInput.files[0];
    if (!file) {
        showError('Please select an image first');
        return;
    }

    try {
        const matchedTablet = await analyzeImage(file);
        if (matchedTablet) {
            displayTabletDetails(matchedTablet, medicineDatabase[matchedTablet]);
        } else {
            showError('Unable to identify tablet. Please search by name.');
        }
    } catch (error) {
        showError('Error processing image');
    }
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

async function analyzeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get image data for analysis
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const characteristics = analyzeImageData(imageData);
                
                // Find best match
                const matchedTablet = findBestMatch(characteristics);
                resolve(matchedTablet);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function analyzeImageData(imageData) {
    // Simple image analysis
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    const pixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }
    
    // Average RGB values
    r = Math.round(r / pixels);
    g = Math.round(g / pixels);
    b = Math.round(b / pixels);
    
    // Determine color category
    const brightness = (r + g + b) / 3;
    const color = brightness > 200 ? "white" : 
                 brightness > 180 ? "off-white" : "other";
    
    // Simple shape detection based on aspect ratio
    const shape = imageData.width / imageData.height > 0.9 && 
                 imageData.width / imageData.height < 1.1 ? "round" : "oval";
    
    return {
        color: color,
        shape: shape
    };
}

function findBestMatch(characteristics) {
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [tabletName, data] of Object.entries(medicineDatabase)) {
        let score = 0;
        const patterns = data.patterns;
        
        // Check color match
        if (patterns.colors.includes(characteristics.color)) {
            score += 0.5;
        }
        
        // Check shape match
        if (patterns.shapes.includes(characteristics.shape)) {
            score += 0.5;
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = tabletName;
        }
    }
    
    return highestScore >= 0.5 ? bestMatch : null;
}

function displayTabletDetails(tabletName, info) {
    resultsSection.classList.remove('hidden');
    
    const html = `
        <h4>${capitalizeFirstLetter(tabletName)}</h4>
        <p><strong>Uses:</strong> ${info.uses}</p>
        <p><strong>Effects:</strong> ${info.effects}</p>
        <p><strong>Side Effects:</strong></p>
        <ul>
            ${info.side_effects.map(effect => `<li>${effect}</li>`).join('')}
        </ul>
        <p><strong>Age Limitation:</strong> ${info.age_limitation}</p>
        <p><strong>Duration:</strong> ${info.duration}</p>
        <p><strong>Cost:</strong> ${info.cost}</p>
        <p><strong>Dosage:</strong></p>
        <ul>
            ${Object.entries(info.dosage).map(([age, dose]) => 
                `<li>${formatAgeGroup(age)}: ${dose}</li>`
            ).join('')}
        </ul>
        <p><strong>Identification Patterns:</strong></p>
        <ul>
            <li>Colors: ${info.patterns.colors.join(', ')}</li>
            <li>Shapes: ${info.patterns.shapes.join(', ')}</li>
            <li>Markings: ${info.patterns.markings.join(', ')}</li>
        </ul>
    `;
    
    tabletDetails.innerHTML = html;
}

function showError(message) {
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove error message after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function resetSearch() {
    tabletNameInput.value = '';
    tabletImageInput.value = '';
    imagePreview.classList.add('hidden');
    resultsSection.classList.add('hidden');
    tabletDetails.innerHTML = '';
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatAgeGroup(ageGroup) {
    return ageGroup
        .split('_')
        .map(word => isNaN(word) ? capitalizeFirstLetter(word) : word)
        .join(' ');
}