# AGENTS.md - Proyecto Clima (Weather App)

## 1. Descripción del Proyecto
Aplicación web cliente (frontend) para consultar el clima actual y el pronóstico meteorológico de distintas ciudades en tiempo real.

## 2. Stack Tecnológico (Restricciones del Equipo)
- **Lenguajes:** HTML5, CSS3 y JavaScript puro (Vanilla JS / ES6+).
- **Frameworks/Librerías:** Ninguno. Sin React, Vue, Tailwind, jQuery ni gestores de paquetes (npm/node).
- **Herramientas de Build:** Ninguna (sin Vite, Webpack, Babel ni bundlers).

## 3. Fuente de Datos / API
- **API Principal:** Open-Meteo (API pública y gratuita, no requiere clave de acceso / API Key).
- **Geocodificación:** `https://geocoding-api.open-meteo.com/v1/search?name={ciudad}` para convertir el nombre de la ciudad en coordenadas (latitud y longitud).
- **Pronóstico:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode` para obtener la temperatura actual, condiciones y pronóstico extendido.

## 4. Cómo Levantar la Aplicación
1. Abrir directamente el archivo `index.html` en cualquier navegador web moderno (Chrome, Edge, Firefox).
2. Opcionalmente, ejecutar mediante un servidor de desarrollo estático local como la extensión **Live Server** de VS Code.

## 5. Convenciones y Reglas de Código
- **Idioma:** Todo el código, comentarios y respuestas de la IA deben estar en **español**.
- **Estructura:** Modularidad clara y separación de responsabilidades (`index.html`, `style.css`, `app.js`).
- **Manejo de Errores y UI:**
  - Control de errores obligatorio con bloques `try/catch` en todas las peticiones asíncronas (`fetch`).
  - Mostrar explícitamente tres estados visuales en la interfaz:
    1. **Carga (Loading):** Indicador mientras se consulta la API.
    2. **Éxito (Success):** Visualización clara de los datos del clima.
    3. **Error (Error/Feedback):** Mensajes amigables en pantalla cuando la ciudad no exista o falle la conexión a internet.
- **Flujo de Trabajo con la IA:** Pedir confirmación antes de crear o modificar archivos y estructurar el desarrollo paso a paso.
## 6. Decisiones de Arquitectura y Diseño (Fase C1)
- **Interfaz y Localización:** UI redactada íntegramente en español. Uso de emojis nativos para representar los códigos WMO del clima (cero dependencias externas).
- **Alcance del Pronóstico:** Visualización del clima actual y pronóstico extendido a 3-5 días mediante tarjetas dinámicas.
- **Flujo de Consumo de API:** Arquitectura secuencial de dos llamadas (`fetch` a Geocodificación y posterior `fetch` a Pronóstico).
- **Gestión de Errores y Estados:** Implementación de un contenedor unificado con tres estados exclusivos (Carga con bloqueo de controles, Éxito con datos estructurados, y Error controlado para fallas de red o ciudades inexistentes).
- **Gestión de Concurrencia y Condiciones de Carrera:**
  - Implementación de una estrategia combinada en `app.js` usando un identificador secuencial de petición (*Token ID*), un objeto `AbortController` para cancelar peticiones de red obsoletas, y un bloqueo visual de controles en el estado de carga. Esto evita que respuestas lentas o clics múltiples sobrescriban el estado final con datos viejos (*stale data*).
- **Ajuste de Endpoint de Clima Actual:** 
  - Se cambió el uso del parámetro `current_weather=true` por `current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m` en el endpoint de Open-Meteo para poder extraer y mostrar explícitamente el porcentaje de humedad relativa en la interfaz.
