#include <DHT.h>
#include <SoftwareSerial.h>


// ======================================================
// E220 LoRa Module Pins
// E220 TXD -> Arduino D2
// E220 RXD -> Arduino D3 (via voltage divider)
// E220 AUX -> Arduino D4
// ======================================================
#define LORA_RX_PIN 2
#define LORA_TX_PIN 3
#define LORA_AUX_PIN 4

SoftwareSerial loraSerial(LORA_RX_PIN, LORA_TX_PIN); // RX, TX

// Unique identifier for this physical node
#define NODE_ID "Node_01"

// LoRa Telemetry Transmission Timer (10 seconds)
const unsigned long LORA_SEND_INTERVAL_MS = 10000UL;
unsigned long lastLoraSendMs = 0;

// ======================================================
// DHT22 / AM2302
// DATA -> Arduino D5
// ======================================================
#define DHTPIN 5
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// ======================================================
// MH-Z19B
// MH-Z19B TX -> Arduino D10
// MH-Z19B RX -> Arduino D11
// ======================================================
SoftwareSerial mhzSerial(10, 11); // RX, TX

byte cmdReadCO2[] = {0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79};

// ======================================================
// PINES
// ======================================================
const byte FAN_PWM_PIN = 9;  // NO CAMBIAR: salida PWM al transistor
const byte FAN_TACH_PIN = 6; // TACH/RPM del ventilador usando pulseIn()

// ======================================================
// SETPOINTS EDITABLES
// ======================================================
float CSP_PPM = 900.0;   // Setpoint CO2 [ppm]
float TEMP_SP_C = 23.5;  // Setpoint temperatura [°C]
float HUM_SP_PCT = 72.0; // Setpoint humedad relativa [%]

// Bandas muertas
float DEADBAND_CO2_PPM = 20.0;
float DEADBAND_TEMP_C = 0.2;
float DEADBAND_HUM_PCT = 1.0;

// ======================================================
// VARIABLES DEL SISTEMA
// ======================================================
int NUM_PERSONAS = 1;
float COUT_PPM = 790.0;
float G_LPS_PERSONA = 0.0052;
float V_AULA_M3 = 12.3;

// ======================================================
// VENTILADORES
// ======================================================
int NUM_FANS = 5;
float FAN_CFM = 62.0;
float ETA = 0.70;
float CFM_TO_M3S = 0.00047194745;

// ======================================================
// CONTROLADOR CO2 PI / PID
// Actualmente es PI porque Kd = 0.
// ======================================================
float Kp_CO2 = 0.0005;
float Ki_CO2 = 0.00005;
float Kd_CO2 = 0.0;

// ======================================================
// CONTROL COMPLEMENTARIO TEMP / HUMEDAD
// Estos no son controladores principales,
// son apoyo mediante ventilación.
// ======================================================
float Kp_TEMP = 0.18;
float Kp_HUM = 0.04;

float U_AMB_MIN = 0.0;
float U_AMB_MAX = 1.0;

bool MANTENER_BASE_CO2 = true;

// ======================================================
// FILTRADO / MUESTREO
// ======================================================
const int N_MUESTRAS = 1;
const unsigned long PREHEAT_MS = 60000UL; // 1 minuto
const unsigned long CONTROL_MS = 5000UL;  // cada 5 segundos
const float ALPHA_FILTRO = 0.35;

// ======================================================
// ANTI-WINDUP / LIMITES
// ======================================================
const float ITERM_MIN = -20000.0;
const float ITERM_MAX = 20000.0;

// ======================================================
// TACH / RPM usando pulseIn en D6
// ======================================================
const byte pulsesPerRevolution = 2;

// ======================================================
// VARIABLES GLOBALES
// ======================================================
unsigned long tInicio = 0;
unsigned long tUltimoControl = 0;

float co2Filtrado = 0.0;
bool primerFiltro = true;

float Iterm_CO2 = 0.0;
float e_prev_CO2 = 0.0;

float temperatura_C = NAN;
float humedad_pct = NAN;

float u_cmd = 0.0;
int dutyPercent = 0;

String modoControl = "INICIO";

// ======================================================
// CONFIGURAR PWM 25 kHz EN PIN D9
// ======================================================
void setup25kHzPWM() {
  pinMode(FAN_PWM_PIN, OUTPUT);

  TCCR1A = 0;
  TCCR1B = 0;

  TCCR1A |= (1 << COM1A1); // PWM en OC1A = D9
  TCCR1A |= (1 << WGM11);
  TCCR1B |= (1 << WGM13);
  TCCR1B |= (1 << CS10); // prescaler = 1

  ICR1 = 320; // 25 kHz
  OCR1A = 0;
}

// ======================================================
// APLICAR DUTY AL VENTILADOR
// OJO: si usas transistor NPN, la señal queda invertida.
// ======================================================
void setFanDutyPercent(int percent) {
  percent = constrain(percent, 0, 100);
  dutyPercent = percent;

  // Invertido por transistor NPN
  OCR1A = map(100 - percent, 0, 100, 0, ICR1);
}

// ======================================================
// LEER RPM POR pulseIn EN D6
// ======================================================
float leerRPMporPulseIn() {
  const int muestras = 3;
  float sumaRPM = 0.0;
  int validas = 0;

  for (int i = 0; i < muestras; i++) {
    unsigned long highTime = pulseIn(FAN_TACH_PIN, HIGH, 120000UL);
    unsigned long lowTime = pulseIn(FAN_TACH_PIN, LOW, 120000UL);

    if (highTime > 0 && lowTime > 0) {
      unsigned long periodo_us = highTime + lowTime;

      if (periodo_us > 0) {
        float rpm = 60000000.0 / (periodo_us * pulsesPerRevolution);
        sumaRPM += rpm;
        validas++;
      }
    }
  }

  if (validas == 0) {
    return 0.0;
  }

  return sumaRPM / validas;
}

// ======================================================
// LEER CO2 MH-Z19B
// ======================================================
bool readCO2Raw(int &ppm) {
  mhzSerial.listen();
  while (mhzSerial.available()) {
    mhzSerial.read();
  }

  mhzSerial.write(cmdReadCO2, 9);

  byte response[9];
  int i = 0;
  unsigned long start = millis();

  while (millis() - start < 500) {
    if (mhzSerial.available()) {
      response[i++] = mhzSerial.read();
      if (i == 9)
        break;
    }
  }

  if (i != 9)
    return false;
  if (response[0] != 0xFF || response[1] != 0x86)
    return false;

  byte checksum = 0;

  for (int j = 1; j < 8; j++) {
    checksum += response[j];
  }

  checksum = 0xFF - checksum + 1;

  if (response[8] != checksum)
    return false;

  ppm = response[2] * 256 + response[3];
  return true;
}

// ======================================================
// LEER PROMEDIO CO2
// ======================================================
bool readCO2Average(float &ppmPromedio) {
  long suma = 0;
  int lecturasValidas = 0;

  for (int i = 0; i < N_MUESTRAS; i++) {
    int ppm = 0;

    if (readCO2Raw(ppm)) {
      suma += ppm;
      lecturasValidas++;
    }

    delay(200);
  }

  if (lecturasValidas == 0)
    return false;

  ppmPromedio = (float)suma / lecturasValidas;
  return true;
}

// ======================================================
// LEER DHT22
// ======================================================
void leerDHT22() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    humedad_pct = h;
    temperatura_C = t;
  }
}

// ======================================================
// CAUDAL OBJETIVO PARA MANTENER SETPOINT CO2
// Qobj = N * G * 1e6 / (Csp - Cout)
// Devuelve [L/s]
// ======================================================
float calcularQobjetivoLps(float csp_ppm, float cout_ppm, float g_lps_persona,
                           int numPersonas) {
  float delta = csp_ppm - cout_ppm;

  if (delta <= 0.0)
    return -1.0;

  return (numPersonas * g_lps_persona * 1000000.0) / delta;
}

// ======================================================
// CABECERA CSV
// ======================================================
void imprimirCabeceraCSV() {
  Serial.println(
      "t_s,t_min,modo,co2_raw_ppm,co2_filt_ppm,setpoint_co2_ppm,cout_ppm,"
      "temperatura_C,setpoint_temp_C,humedad_pct,setpoint_hum_pct,error_co2_"
      "ppm,error_temp_C,error_hum_pct,u_ff_pct,u_co2_pid_pct,u_temp_pct,u_hum_"
      "pct,u_total_pct,duty_pct,Q_Lps,Q_m3h,rpm,Iterm_CO2");
}

// ======================================================
// ENVIAR TELEMETRIA LORA
// ======================================================
void sendLoraTelemetry() {
  char payload[128];

  // Formatear flotantes para JSON
  char tempStr[8];
  char humStr[8];

  if (isnan(temperatura_C)) {
    strcpy(tempStr, "0.0");
  } else {
    dtostrf(temperatura_C, 0, 1, tempStr);
  }

  if (isnan(humedad_pct)) {
    strcpy(humStr, "0.0");
  } else {
    dtostrf(humedad_pct, 0, 1, humStr);
  }

  // Si co2Filtrado es 0 (antes de la primera lectura del control), usar valor
  // base
  int co2Val = (int)(co2Filtrado + 0.5);
  if (co2Val <= 0) {
    co2Val = 400; // Valor base por defecto
  }

  // Polvo simulado (ya que no hay sensor en este sistema de ventilacion)
  int dust = random(5, 100);

  snprintf(payload, sizeof(payload),
           "{\"node_id\":\"%s\",\"co2\":%d,\"dust\":%d,\"temperature\":%s,"
           "\"humidity\":%s}",
           NODE_ID, co2Val, dust, tempStr, humStr);

  // Esperar a que el módulo esté listo (AUX HIGH) con timeout no bloqueante de
  // envío
  unsigned long waitStart = millis();
  while (digitalRead(LORA_AUX_PIN) == LOW) {
    if (millis() - waitStart > 1000UL) {
      Serial.println(
          F("# [LORA] Warning: E220 AUX stuck LOW; transmitting anyway."));
      break;
    }
  }

  loraSerial.print(payload);
  loraSerial.print('\n');

  Serial.print(F("# [LORA] Sent: "));
  Serial.println(payload);
}

// ======================================================
// SETUP
// ======================================================
void setup() {
  Serial.begin(115200);
  mhzSerial.begin(9600);
  loraSerial.begin(9600);
  dht.begin();

  pinMode(FAN_TACH_PIN, INPUT_PULLUP);
  pinMode(LORA_AUX_PIN, INPUT_PULLUP);

  mhzSerial.listen(); // default to listening to CO2 sensor

  setup25kHzPWM();
  setFanDutyPercent(0);

  tInicio = millis();
  randomSeed(analogRead(A0));

  Serial.println("# CONTROL CO2 PRIORITARIO + TEMPERATURA + HUMEDAD");
  Serial.println("# DHT22 DATA en D5");
  Serial.println("# TACH/RPM ventilador en D6 usando pulseIn");
  Serial.println("# PWM transistor/fan en D9");
  Serial.println("# MH-Z19B TX -> D10 | MH-Z19B RX -> D11");
  Serial.println("# E220 LoRa TXD -> D2 | RXD -> D3 | AUX -> D4");
  Serial.println("# Prioridad 1: CO2");
  Serial.println("# Prioridad 2: Temperatura / Humedad");
  Serial.println("# Esperando precalentamiento del MH-Z19B...");
}

// ======================================================
// LOOP
// ======================================================
void loop() {
  // --------------------------------------------------
  // PRECALENTAMIENTO DEL MH-Z19B
  // --------------------------------------------------
  if (millis() - tInicio < PREHEAT_MS) {
    static unsigned long lastMsg = 0;

    if (millis() - lastMsg > 5000) {
      leerDHT22();

      Serial.print("# Precalentando MH-Z19B... ");
      Serial.print("Temperatura: ");
      Serial.print(temperatura_C, 2);
      Serial.print(" C | Humedad: ");
      Serial.print(humedad_pct, 2);
      Serial.println(" %");

      lastMsg = millis();
    }

    return;
  }

  static bool cabeceraImpresa = false;

  if (!cabeceraImpresa) {
    imprimirCabeceraCSV();
    cabeceraImpresa = true;
  }

  // --------------------------------------------------
  // CONTROL CADA CONTROL_MS
  // --------------------------------------------------
  if (millis() - tUltimoControl >= CONTROL_MS) {
    float Ts = CONTROL_MS / 1000.0;
    tUltimoControl = millis();

    // -------- Leer CO2 --------
    float cinPromedio = 0.0;
    bool okCO2 = readCO2Average(cinPromedio);

    if (!okCO2) {
      Serial.println("# Error leyendo MH-Z19B");
      return;
    }

    // -------- Leer temperatura y humedad --------
    leerDHT22();

    // -------- Filtrado CO2 --------
    if (primerFiltro) {
      co2Filtrado = cinPromedio;
      primerFiltro = false;
    } else {
      co2Filtrado =
          ALPHA_FILTRO * cinPromedio + (1.0 - ALPHA_FILTRO) * co2Filtrado;
    }

    // -------- Caudal máximo --------
    float Qmax_m3s = NUM_FANS * FAN_CFM * CFM_TO_M3S;
    float QefectivoMax_m3s = ETA * Qmax_m3s;

    // -------- Feedforward CO2 --------
    float Qobjetivo_Lps =
        calcularQobjetivoLps(CSP_PPM, COUT_PPM, G_LPS_PERSONA, NUM_PERSONAS);
    float Qobjetivo_m3s =
        (Qobjetivo_Lps > 0.0) ? (Qobjetivo_Lps / 1000.0) : 0.0;

    float u_ff = 0.0;

    if (QefectivoMax_m3s > 0.0) {
      u_ff = Qobjetivo_m3s / QefectivoMax_m3s;
    }

    u_ff = constrain(u_ff, 0.0, 1.0);

    // ==================================================
    // ERRORES
    // ==================================================
    float e_co2 = co2Filtrado - CSP_PPM;
    float e_co2_ctrl = e_co2;

    if (abs(e_co2_ctrl) < DEADBAND_CO2_PPM) {
      e_co2_ctrl = 0.0;
    }

    float e_temp = 0.0;
    float e_hum = 0.0;

    bool lecturaDHTok = (!isnan(temperatura_C) && !isnan(humedad_pct));

    if (lecturaDHTok) {
      e_temp = temperatura_C - TEMP_SP_C;
      e_hum = humedad_pct - HUM_SP_PCT;

      if (abs(e_temp) < DEADBAND_TEMP_C) {
        e_temp = 0.0;
      }

      if (abs(e_hum) < DEADBAND_HUM_PCT) {
        e_hum = 0.0;
      }
    }

    // ==================================================
    // CONTROL CO2 PI/PID
    // ==================================================
    float Dterm_CO2 = (e_co2_ctrl - e_prev_CO2) / Ts;
    e_prev_CO2 = e_co2_ctrl;

    float u_co2_pid_unsat =
        Kp_CO2 * e_co2_ctrl + Ki_CO2 * Iterm_CO2 + Kd_CO2 * Dterm_CO2;
    float u_co2_unsat = u_ff + u_co2_pid_unsat;

    bool satSuperior = (u_co2_unsat >= 1.0 && e_co2_ctrl > 0.0);
    bool satInferior = (u_co2_unsat <= 0.0 && e_co2_ctrl < 0.0);

    if (!(satSuperior || satInferior)) {
      Iterm_CO2 += e_co2_ctrl * Ts;
      Iterm_CO2 = constrain(Iterm_CO2, ITERM_MIN, ITERM_MAX);
    }

    float u_co2_pid =
        Kp_CO2 * e_co2_ctrl + Ki_CO2 * Iterm_CO2 + Kd_CO2 * Dterm_CO2;
    float u_co2_total = constrain(u_ff + u_co2_pid, 0.0, 1.0);

    // ==================================================
    // CONTROL TEMPERATURA Y HUMEDAD
    // Solo actúan si CO2 ya está dentro de rango.
    // ==================================================
    float u_temp = 0.0;
    float u_hum = 0.0;

    if (lecturaDHTok) {
      if (e_temp > 0.0) {
        u_temp = Kp_TEMP * e_temp;
      }

      if (e_hum > 0.0) {
        u_hum = Kp_HUM * e_hum;
      }
    }

    u_temp = constrain(u_temp, U_AMB_MIN, U_AMB_MAX);
    u_hum = constrain(u_hum, U_AMB_MIN, U_AMB_MAX);

    // ==================================================
    // LÓGICA DE PRIORIDAD
    // ==================================================
    bool co2NecesitaControl = (e_co2_ctrl > 0.0);
    bool tempNecesitaControl = (lecturaDHTok && e_temp > 0.0);
    bool humNecesitaControl = (lecturaDHTok && e_hum > 0.0);

    if (co2NecesitaControl) {
      // PRIORIDAD 1: CO2
      u_cmd = u_co2_total;
      modoControl = "CO2";

    } else if (tempNecesitaControl || humNecesitaControl) {
      // PRIORIDAD 2: Temperatura / Humedad
      float u_amb = max(u_temp, u_hum);

      if (MANTENER_BASE_CO2) {
        u_cmd = max(u_ff, u_amb);
      } else {
        u_cmd = u_amb;
      }

      if (u_temp >= u_hum && tempNecesitaControl) {
        modoControl = "TEMP";
      } else {
        modoControl = "HUM";
      }

    } else {
      // TODO OK
      if (MANTENER_BASE_CO2) {
        u_cmd = u_ff;
        modoControl = "BASE_CO2";
      } else {
        u_cmd = 0.0;
        modoControl = "OK";
      }
    }

    u_cmd = constrain(u_cmd, 0.0, 1.0);

    // -------- Aplicar duty --------
    int duty = (int)(u_cmd * 100.0 + 0.5);
    setFanDutyPercent(duty);

    // -------- Caudal aplicado --------
    float Qaplicado_m3s = QefectivoMax_m3s * u_cmd;
    float Qaplicado_Lps = Qaplicado_m3s * 1000.0;
    float Qaplicado_m3h = Qaplicado_m3s * 3600.0;

    // -------- RPM usando pulseIn en D6 --------
    float rpm = leerRPMporPulseIn();

    // -------- Tiempo --------
    float tiempo_s = (millis() - tInicio - PREHEAT_MS) / 1000.0;
    float tiempo_min = tiempo_s / 60.0;

    // -------- LOG CSV --------
    Serial.print(tiempo_s, 1);
    Serial.print(",");
    Serial.print(tiempo_min, 3);
    Serial.print(",");
    Serial.print(modoControl);
    Serial.print(",");
    Serial.print(cinPromedio, 1);
    Serial.print(",");
    Serial.print(co2Filtrado, 1);
    Serial.print(",");
    Serial.print(CSP_PPM, 1);
    Serial.print(",");
    Serial.print(COUT_PPM, 1);
    Serial.print(",");
    Serial.print(temperatura_C, 2);
    Serial.print(",");
    Serial.print(TEMP_SP_C, 2);
    Serial.print(",");
    Serial.print(humedad_pct, 2);
    Serial.print(",");
    Serial.print(HUM_SP_PCT, 2);
    Serial.print(",");
    Serial.print(e_co2, 1);
    Serial.print(",");
    Serial.print(e_temp, 2);
    Serial.print(",");
    Serial.print(e_hum, 2);
    Serial.print(",");
    Serial.print(u_ff * 100.0, 2);
    Serial.print(",");
    Serial.print(u_co2_pid * 100.0, 2);
    Serial.print(",");
    Serial.print(u_temp * 100.0, 2);
    Serial.print(",");
    Serial.print(u_hum * 100.0, 2);
    Serial.print(",");
    Serial.print(u_cmd * 100.0, 2);
    Serial.print(",");
    Serial.print(dutyPercent);
    Serial.print(",");
    Serial.print(Qaplicado_Lps, 2);
    Serial.print(",");
    Serial.print(Qaplicado_m3h, 2);
    Serial.print(",");
    Serial.print(rpm, 0);
    Serial.print(",");
    Serial.println(Iterm_CO2, 2);
  }

  // --------------------------------------------------
  // TRANSMISIÓN LORA CADA LORA_SEND_INTERVAL_MS
  // --------------------------------------------------
  if (millis() - lastLoraSendMs >= LORA_SEND_INTERVAL_MS) {
    lastLoraSendMs = millis();
    sendLoraTelemetry();
  }
}
