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
        title: "Dual ESP32 Motor Control (ESP-NOW)",
        subtitle: "One-Way Peer-to-Peer Communication & H-Bridge Control",
        desc: "Controls a DC motor using two ESP32 microcontrollers communicating wirelessly via ESP-NOW. Includes a helper sketch to find the Receiver's physical MAC address, a Sender program that reads command inputs, and a Receiver program that controls H-bridge signals.",
        tags: ["ESP-NOW", "Dual ESP32", "Motor Control", "H-Bridge"],
        isMultiFile: true,
        files: {
            mac: {
                name: "Receiver MAC Address Finder",
                code: `#include "WiFi.h"

void setup() {
  Serial.begin(115200);
  delay(1000); // Give the Serial Monitor time to connect after reset
  
  // 1. Initialize the Wi-Fi hardware state completely
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(); // Ensure it isn't trying to connect to a router
  
  delay(100); // Small pause to let the radio stack spin up
  
  // 2. Print out the real hardware MAC address
  Serial.println("\n------------------------------------");
  Serial.print("Motor ESP32 MAC Address: ");
  Serial.println(WiFi.macAddress());
  Serial.println("------------------------------------");
}

void loop() {
  // Nothing here
}`
            },
            sender: {
                name: "ESP-NOW Sender Code",
                code: `#include <esp_now.h>
#include <WiFi.h>

const int FWD_BUTTON_PIN = 4;
const int BCK_BUTTON_PIN = 5;

// The universal Broadcast Address (sends to ALL listening devices)
uint8_t broadcastAddress[] = {0xB0, 0xCB, 0xD8, 0x0A, 0x73, 0x6C}; 

typedef struct struct_message {
  int direction; // 0 = Stop, 1 = Forward, 2 = Backward
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

void setup() {
  Serial.begin(115200);
  
  pinMode(FWD_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BCK_BUTTON_PIN, INPUT_PULLUP);

  // Set Wi-Fi to Station mode
  WiFi.mode(WIFI_STA);

  // OPTIONAL BUT RECOMMENDED: Lock to Wi-Fi Channel 1
  // ESP-NOW broadcasting works best when devices are strictly on the same channel
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register the broadcast peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 1; // Explicitly target channel 1 
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Failed to add broadcast peer");
    return;
  }
}

void loop() {
  int fwdState = digitalRead(FWD_BUTTON_PIN);
  int bckState = digitalRead(BCK_BUTTON_PIN);
  int lastCommand = myData.direction;

  if (fwdState == LOW) {
    myData.direction = 1;
  } else if (bckState == LOW) {
    myData.direction = 2;
  } else {
    myData.direction = 0;
  }

  // Send only on state change to keep the broadcast channel clean
  if (myData.direction != lastCommand) {
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));
    if (result == ESP_OK) {
      Serial.printf("Broadcasted Command: %d\n", myData.direction);
    } else {
      Serial.println("Broadcast Error");
    }
  }
  delay(50); 
}`
            },
            receiver: {
                name: "ESP-NOW Receiver Code",
                code: `#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h> // Required to manually set the channel

const int IN1 = 12;
const int IN2 = 13;

typedef struct struct_message {
  int direction;
} struct_message;

struct_message incomingData;

void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingDataRaw, int len) {
  memcpy(&incomingData, incomingDataRaw, sizeof(incomingData));
  
  if (incomingData.direction == 1) {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    Serial.println("Motor: FORWARD");
  } 
  else if (incomingData.direction == 2) {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    Serial.println("Motor: BACKWARD");
  } 
  else {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    Serial.println("Motor: STOP");
  }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  WiFi.mode(WIFI_STA);

  // Force the ESP32 Wi-Fi config onto Channel 1 to guarantee it catches the broadcast
  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  
  esp_now_register_recv_cb(OnDataRecv);
  Serial.println("Receiver ready, listening on Channel 1...");
}

void loop() {
  // Stays empty
}`
            }
        }
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

// Helper to escape HTML characters for code blocks
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    
    const modalContainer = document.querySelector('.modal-container');
    const modalBody = document.querySelector('.modal-body');
    
    if (prog.isMultiFile) {
        modalContainer.classList.add('modal-large');
        btnCopy.style.display = 'none';
        
        modalBody.innerHTML = `
            <div class="multi-code-container">
                <div class="section-full-width">
                    <div class="code-header-inline">
                        <span class="code-title-text">Step 1: ${escapeHTML(prog.files.mac.name)}</span>
                        <button class="btn-copy-inline" data-code-id="mac-code">
                            <i data-feather="copy" class="copy-icon-inline"></i>
                            <span class="copy-text-inline">Copy</span>
                        </button>
                    </div>
                    <p class="code-desc-inline">Flash this program onto your target ESP32 to retrieve its hardware MAC address via the Serial Monitor. Write down this address to put in the Sender program.</p>
                    <div class="code-wrapper">
                        <pre class="line-numbers"><code class="language-cpp" id="mac-code">${escapeHTML(prog.files.mac.code)}</code></pre>
                    </div>
                </div>
                
                <div class="sections-split">
                    <div class="section-column">
                        <div class="code-header-inline">
                            <span class="code-title-text">Step 2: ${escapeHTML(prog.files.sender.name)}</span>
                            <button class="btn-copy-inline" data-code-id="sender-code">
                                <i data-feather="copy" class="copy-icon-inline"></i>
                                <span class="copy-text-inline">Copy</span>
                            </button>
                        </div>
                        <p class="code-desc-inline">Flash this on the ESP32 that has buttons connected to Pin 4 and Pin 5. Remember to replace the <code>broadcastAddress</code> with your receiver's MAC address.</p>
                        <div class="code-wrapper">
                            <pre class="line-numbers"><code class="language-cpp" id="sender-code">${escapeHTML(prog.files.sender.code)}</code></pre>
                        </div>
                    </div>
                    
                    <div class="section-column">
                        <div class="code-header-inline">
                            <span class="code-title-text">Step 3: ${escapeHTML(prog.files.receiver.name)}</span>
                            <button class="btn-copy-inline" data-code-id="receiver-code">
                                <i data-feather="copy" class="copy-icon-inline"></i>
                                <span class="copy-text-inline">Copy</span>
                            </button>
                        </div>
                        <p class="code-desc-inline">Flash this on the ESP32 that is connected to the L298N/L293D motor driver at Pin 12 and Pin 13.</p>
                        <div class="code-wrapper">
                            <pre class="line-numbers"><code class="language-cpp" id="receiver-code">${escapeHTML(prog.files.receiver.code)}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to the inline copy buttons
        const copyBtns = modalBody.querySelectorAll('.btn-copy-inline');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-code-id');
                const codeText = document.getElementById(targetId).textContent;
                navigator.clipboard.writeText(codeText)
                    .then(() => {
                        // Success state
                        btn.classList.add('copied');
                        btn.querySelector('.copy-text-inline').textContent = 'Copied!';
                        const icon = btn.querySelector('.copy-icon-inline');
                        icon.setAttribute('data-feather', 'check');
                        feather.replace();
                        showToast();
                        
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            btn.querySelector('.copy-text-inline').textContent = 'Copy';
                            icon.setAttribute('data-feather', 'copy');
                            feather.replace();
                        }, 2000);
                    });
            });
        });
        
    } else {
        modalContainer.classList.remove('modal-large');
        btnCopy.style.display = 'flex';
        
        modalBody.innerHTML = `
            <div class="code-wrapper">
                <pre class="line-numbers"><code class="language-cpp" id="code-snippet"></code></pre>
            </div>
        `;
        const codeSnippet = document.getElementById('code-snippet');
        codeSnippet.textContent = prog.code;
    }
    
    // Show Modal
    codeModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scroll on background
    
    // Highlight Code via Prism
    const codesToHighlight = modalBody.querySelectorAll('code');
    codesToHighlight.forEach(el => Prism.highlightElement(el));
    
    // Reset copy button state
    resetCopyButtonState();
    feather.replace();
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
