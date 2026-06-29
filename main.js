// Programs Database
const programs = [
    {
        id: 1,
        title: "ESP32 Web Server LED Control",
        subtitle: "ESP32 Web Hosting & LED Brightness Controller via PWM",
        desc: "Creates a standalone Wi-Fi Access Point on the ESP32 and hosts a dynamic HTML portal. Users can slide a slider on their mobile web browser to control the brightness of a connected LED using Pulse Width Modulation (PWM).",
        tags: ["Web Server", "PWM", "Wi-Fi AP", "ESP32"],
        code: `#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "ESP32_LED_Control";
const char* password = "12345678";

WebServer server(80);

// ---------------- PWM ----------------
const int LED_PIN = 18;
const int PWM_FREQ = 5000;
const int PWM_RESOLUTION = 8; // 8-bit (0-255)

// ---------------- HTML webpage ----------------
const char webpage[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 LED Brightness</title>
<style>
body {
    font-family: Arial, sans-serif;
    text-align: center;
    background: #f5f5f5;
    margin-top: 40px;
}
h1 {
    color: #1976D2;
}
.slider {
    width: 80%;
    max-width: 400px;
}
.value {
    font-size: 28px;
    color: #444;
    margin: 20px;
}
</style>
</head>
<body>
<h1>ESP32 LED Controller</h1>
<div class="value">
Brightness: <span id="brightness">0</span>
</div>
<input type="range" min="0" max="255" value="0" class="slider" id="slider" oninput="updateBrightness(this.value)">
<script>
function updateBrightness(value) {
    document.getElementById("brightness").innerHTML = value;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/set?value=" + value, true);
    xhr.send();
}
</script>
</body>
</html>
)rawliteral";

// ---------------- Handlers ----------------

void handleRoot() {
    server.send(200, "text/html", webpage);
}

void handleBrightness() {
    if (server.hasArg("value")) {
        int value = server.arg("value").toInt();
        value = constrain(value, 0, 255);
        ledcWrite(LED_PIN, value);

        Serial.print("Brightness : ");
        Serial.println(value);
    }
    server.send(200, "text/plain", "OK");
}

void setup() {
    Serial.begin(115200);

    // Configure PWM
    if (!ledcAttach(LED_PIN, PWM_FREQ, PWM_RESOLUTION)) {
        Serial.println("Failed to configure PWM!");
        while (1);
    }
    ledcWrite(LED_PIN, 0);

    // Create Access Point
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ssid, password);

    Serial.println();
    Serial.println("=================================");
    Serial.println("Access Point Started");
    Serial.print("SSID : ");
    Serial.println(ssid);
    Serial.print("Password : ");
    Serial.println(password);
    Serial.print("IP Address : ");
    Serial.println(WiFi.softAPIP());
    Serial.println("=================================");

    server.on("/", handleRoot);
    server.on("/set", handleBrightness);
    server.begin();

    Serial.println("HTTP Server Started");
}

void loop() {
    server.handleClient();
}`
    },
    {
        id: 2,
        title: "Firebase Cloud Sync (IR Sensor)",
        subtitle: "ESP32 WiFi Connection & Firebase RTDB Uplink",
        desc: "Connects to a local Wi-Fi router, synchronizes network time (NTP) to Indian Standard Time (IST), detects obstacle state changes using an Infrared (IR) sensor, and pushes timestamps and status flags to the Google Firebase Cloud Database in real-time.",
        tags: ["Firebase", "HTTP Client", "NTP Time", "Sensor"],
        code: `#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

// =========================
// WiFi Credentials
// =========================
const char* ssid = "Wifi Name ";
const char* password = "Password";

// =========================
// Firebase Realtime Database URL
// =========================
const char* firebaseHost = "https://esp32-ir-e27ee-default-rtdb.asia-southeast1.firebasedatabase.app";

// =========================
// IR Sensor Pin
// =========================
const int IR_PIN = 27;

// =========================
// Time Settings (IST)
// =========================
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // +5:30
const int daylightOffset_sec = 0;

String previousStatus = "";

void setup() {
    Serial.begin(115200);
    pinMode(IR_PIN, INPUT);

    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Synchronize time
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    struct tm timeinfo;
    Serial.print("Synchronizing Time");

    while (!getLocalTime(&timeinfo)) {
        Serial.print(".");
        delay(500);
    }
    Serial.println("\\nTime synchronized!");
}

void loop() {
    // LOW = Object Detected, HIGH = Not Detected
    String status = (digitalRead(IR_PIN) == LOW) ? "Object Detected" : "Not Detected";

    // Upload only if state changes
    if (status != previousStatus) {
        previousStatus = status;
        struct tm timeinfo;

        if (getLocalTime(&timeinfo)) {
            char timeString[30];
            strftime(timeString, sizeof(timeString), "%d %B %Y %I:%M:%S %p", &timeinfo);

            Serial.println("--------------------------------");
            Serial.print("Status : ");
            Serial.println(status);
            Serial.print("Time   : ");
            Serial.println(timeString);

            // Firebase keys cannot contain spaces or colons
            String key = String(timeString);
            key.replace(" ", "_");
            key.replace(":", "-");

            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                String url = String(firebaseHost) + "/detections/" + key + ".json";

                http.begin(url);
                http.addHeader("Content-Type", "application/json");

                // Store status as JSON value
                String json = "\\"" + status + "\\"";
                int response = http.PUT(json);

                Serial.print("HTTP Response: ");
                Serial.println(response);
                http.end();
            }
        }
    }
    delay(100);
}`
    },
    {
        id: 3,
        title: "Blink Built-In LED",
        subtitle: "Basic GPIO Control & Timing Cycles",
        desc: "The 'Hello World' of hardware programming. Sets up the ESP32's built-in LED pin (GPIO 2) as an output, then toggles it ON and OFF in an infinite loop using 500ms delay steps.",
        tags: ["GPIO", "Blink", "LED", "Basic"],
        code: `const int LED_PIN = 2; // Onboard LED generally mapped to pin 2

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_PIN, HIGH); // LED ON
    delay(500);

    digitalWrite(LED_PIN, LOW);  // LED OFF
    delay(500);
}`
    },
    {
        id: 4,
        title: "Ultrasonic Distance measurement",
        subtitle: "Proximity Sensor Signal Processing",
        desc: "Drives the HC-SR04 Ultrasonic transducer by outputting a 10-microsecond high trigger pulse. Listens to the Echo Pin pulse duration, calculates speed-of-sound travel time, and outputs physical target distance in centimeters over Serial.",
        tags: ["Sensors", "Ultrasonic", "PulseIn", "Serial"],
        code: `#define TRIG_PIN 5
#define ECHO_PIN 18

void setup() {
    Serial.begin(115200);

    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
}

void loop() {
    // Clear trigger
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    // Send 10µs pulse
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // Measure echo duration (microseconds)
    long duration = pulseIn(ECHO_PIN, HIGH);

    // Calculate distance (cm)
    // Speed of sound: 343 m/s -> 0.0343 cm/microsecond. Divide by 2 for out-and-back trip.
    float distance = duration * 0.0343 / 2.0;

    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");

    delay(500);
}`
    },
    {
        id: 5,
        title: "Program 05",
        subtitle: "Additional module coming soon",
        desc: "This slot is reserved for the next IoT lab module. Future programs such as MQTT brokers, bluetooth interfaces, or display outputs can be added here once provided.",
        tags: ["Upcoming", "Locked"],
        code: `// Coming Soon
// This slot is reserved for your 5th program.
// Upload the docx/pdf or write the code block, and we will integrate it.`,
        locked: true
    }
];

// Document Elements
const gridContainer = document.getElementById('programs-grid');
const codeModal = document.getElementById('code-modal');
const modalNumber = document.getElementById('modal-number');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalTags = document.getElementById('modal-tags');
const codeSnippet = document.getElementById('code-snippet');
const btnCopy = document.getElementById('btn-copy');
const modalClose = document.getElementById('modal-close');
const toast = document.getElementById('toast');

let activeProgramId = null;

// Initialize Web App
window.addEventListener('DOMContentLoaded', () => {
    renderCards();
    setupEventListeners();
    feather.replace(); // Load Feather icons
});

// Render Cards dynamically
function renderCards() {
    gridContainer.innerHTML = '';
    
    programs.forEach(prog => {
        const formattedNum = String(prog.id).padStart(2, '0');
        const card = document.createElement('div');
        
        if (prog.locked) {
            card.className = 'program-card card-locked';
            card.innerHTML = `
                <div class="card-top">
                    <span class="card-number">${formattedNum}</span>
                    <i data-feather="lock" class="card-icon"></i>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${prog.title}</h3>
                    <p class="card-desc">${prog.desc}</p>
                </div>
                <div class="card-footer">
                    <span class="tag">COMING SOON</span>
                </div>
            `;
        } else {
            card.className = 'program-card';
            card.dataset.id = prog.id;
            
            const tagsHTML = prog.tags.map(t => `<span class="tag">${t}</span>`).join('');
            
            card.innerHTML = `
                <div class="card-top">
                    <span class="card-number">${formattedNum}</span>
                    <i data-feather="arrow-up-right" class="card-icon"></i>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${prog.title}</h3>
                    <p class="card-desc">${prog.desc}</p>
                </div>
                <div class="card-footer">
                    ${tagsHTML}
                </div>
            `;
        }
        
        gridContainer.appendChild(card);
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Card Click to open code modal
    gridContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.program-card:not(.card-locked)');
        if (card) {
            const id = parseInt(card.dataset.id);
            openModal(id);
        }
    });

    // Close Modal
    modalClose.addEventListener('click', closeModal);
    
    // Close Modal when clicking outside
    codeModal.addEventListener('click', (e) => {
        if (e.target === codeModal) {
            closeModal();
        }
    });

    // Close Modal with Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && codeModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Copy Code Button
    btnCopy.addEventListener('click', copyCode);
}

// Open Code Modal
function openModal(id) {
    const prog = programs.find(p => p.id === id);
    if (!prog) return;
    
    activeProgramId = id;
    
    // Set text contents
    modalNumber.textContent = String(prog.id).padStart(2, '0');
    modalTitle.textContent = prog.title;
    modalSubtitle.textContent = prog.subtitle;
    
    // Render tags
    modalTags.innerHTML = prog.tags.map(t => `<span class="tag">${t}</span>`).join('');
    
    // Set code content
    codeSnippet.textContent = prog.code;
    
    // Show Modal
    codeModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scroll on background
    
    // Highlight Code via Prism
    Prism.highlightElement(codeSnippet);
    
    // Reset copy button state
    resetCopyButtonState();
}

// Close Modal
function closeModal() {
    codeModal.classList.remove('active');
    document.body.style.overflow = ''; // Enable scroll on background
    activeProgramId = null;
}

// Copy Code to Clipboard
function copyCode() {
    if (activeProgramId === null) return;
    
    const prog = programs.find(p => p.id === activeProgramId);
    if (!prog) return;
    
    navigator.clipboard.writeText(prog.code)
        .then(() => {
            setCopySuccessState();
            showToast();
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

// Set copy success state on button
function setCopySuccessState() {
    btnCopy.classList.add('copied');
    btnCopy.querySelector('.copy-text').textContent = 'Copied!';
    btnCopy.querySelector('.copy-icon').setAttribute('data-feather', 'check');
    feather.replace();
    
    setTimeout(() => {
        resetCopyButtonState();
    }, 2000);
}

// Reset copy button to initial state
function resetCopyButtonState() {
    btnCopy.classList.remove('copied');
    btnCopy.querySelector('.copy-text').textContent = 'Copy Code';
    btnCopy.querySelector('.copy-icon').setAttribute('data-feather', 'copy');
    feather.replace();
}

// Show Toast Alert
function showToast() {
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
