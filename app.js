"use strict";

const URL_GEOCODIFICACION = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PRONOSTICO = "https://api.open-meteo.com/v1/forecast";

const CIUDAD_INICIAL = "Quetzaltenango";
const DIAS_PRONOSTICO = 5;

const MAPA_CLIMA = {
    0: { emoji: "☀️", descripcion: "Cielo despejado" },
    1: { emoji: "🌤️", descripcion: "Mayormente despejado" },
    2: { emoji: "⛅", descripcion: "Parcialmente nublado" },
    3: { emoji: "☁️", descripcion: "Nublado" },
    45: { emoji: "🌫️", descripcion: "Niebla" },
    48: { emoji: "🌫️", descripcion: "Niebla con escarcha" },
    51: { emoji: "🌦️", descripcion: "Llovizna ligera" },
    53: { emoji: "🌦️", descripcion: "Llovizna moderada" },
    55: { emoji: "🌦️", descripcion: "Llovizna densa" },
    56: { emoji: "🌧️", descripcion: "Llovizna helada ligera" },
    57: { emoji: "🌧️", descripcion: "Llovizna helada densa" },
    61: { emoji: "🌧️", descripcion: "Lluvia ligera" },
    63: { emoji: "🌧️", descripcion: "Lluvia moderada" },
    65: { emoji: "🌧️", descripcion: "Lluvia fuerte" },
    66: { emoji: "🌧️", descripcion: "Lluvia helada ligera" },
    67: { emoji: "🌧️", descripcion: "Lluvia helada fuerte" },
    71: { emoji: "❄️", descripcion: "Nieve ligera" },
    73: { emoji: "❄️", descripcion: "Nieve moderada" },
    75: { emoji: "❄️", descripcion: "Nieve fuerte" },
    77: { emoji: "❄️", descripcion: "Granos de nieve" },
    80: { emoji: "🌦️", descripcion: "Chubascos ligeros" },
    81: { emoji: "🌧️", descripcion: "Chubascos moderados" },
    82: { emoji: "⛈️", descripcion: "Chubascos fuertes" },
    85: { emoji: "🌨️", descripcion: "Nevadas ligeras" },
    86: { emoji: "🌨️", descripcion: "Nevadas fuertes" },
    95: { emoji: "⛈️", descripcion: "Tormenta eléctrica" },
    96: { emoji: "⛈️", descripcion: "Tormenta con granizo ligero" },
    99: { emoji: "⛈️", descripcion: "Tormenta con granizo fuerte" }
};

const CLIMA_DESCONOCIDO = { emoji: "🌡️", descripcion: "Condición desconocida" };

const elementos = {
    formulario: document.getElementById("formulario-busqueda"),
    entrada: document.getElementById("entrada-ciudad"),
    boton: document.getElementById("boton-buscar"),
    estadoCarga: document.getElementById("estado-carga"),
    estadoExito: document.getElementById("estado-exito"),
    estadoError: document.getElementById("estado-error"),
    nombreCiudad: document.getElementById("nombre-ciudad"),
    fechaActual: document.getElementById("fecha-actual"),
    iconoActual: document.getElementById("icono-actual"),
    temperaturaActual: document.getElementById("temperatura-actual"),
    descripcionActual: document.getElementById("descripcion-actual"),
    vientoActual: document.getElementById("viento-actual"),
    humedadActual: document.getElementById("humedad-actual"),
    pronostico: document.getElementById("pronostico"),
    mensajeError: document.getElementById("mensaje-error")
};

let idPeticion = 0;
let controladorActual = null;

function describirClima(codigo) {
    return MAPA_CLIMA[codigo] || CLIMA_DESCONOCIDO;
}

function bloquearControles(bloquear) {
    elementos.entrada.disabled = bloquear;
    elementos.boton.disabled = bloquear;
}

function ocultarEstados() {
    elementos.estadoCarga.hidden = true;
    elementos.estadoExito.hidden = true;
    elementos.estadoError.hidden = true;
}

function mostrarCarga() {
    ocultarEstados();
    elementos.estadoCarga.hidden = false;
    bloquearControles(true);
}

function mostrarExito() {
    ocultarEstados();
    elementos.estadoExito.hidden = false;
}

function mostrarError(mensaje) {
    ocultarEstados();
    elementos.mensajeError.textContent = mensaje;
    elementos.estadoError.hidden = false;
}

async function obtenerCoordenadas(ciudad, signal) {
    const url = `${URL_GEOCODIFICACION}?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`;
    const respuesta = await fetch(url, { signal });

    if (!respuesta.ok) {
        throw new Error(`Error de geocodificación (HTTP ${respuesta.status})`);
    }

    const datos = await respuesta.json();

    if (!datos.results || datos.results.length === 0) {
        return null;
    }

    const lugar = datos.results[0];
    return {
        lat: lugar.latitude,
        lon: lugar.longitude,
        nombre: lugar.name,
        admin: lugar.admin1 || "",
        pais: lugar.country || ""
    };
}

async function obtenerClima(lat, lon, signal) {
    const parametros = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,relative_humidity_2m,weathercode,windspeed_10m",
        daily: "weathercode,temperature_2m_max,temperature_2m_min",
        timezone: "auto"
    });

    const respuesta = await fetch(`${URL_PRONOSTICO}?${parametros}`, { signal });

    if (!respuesta.ok) {
        throw new Error(`Error de pronóstico (HTTP ${respuesta.status})`);
    }

    return respuesta.json();
}

function formatearFechaLarga(fechaISO) {
    const fecha = new Date(`${fechaISO}T00:00:00`);
    return fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

function formatearDiaCorto(fechaISO) {
    const fecha = new Date(`${fechaISO}T00:00:00`);
    return fecha.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric"
    });
}

function renderPronostico(diario) {
    elementos.pronostico.innerHTML = "";
    const total = Math.min(DIAS_PRONOSTICO, diario.time.length);

    for (let i = 0; i < total; i++) {
        const clima = describirClima(diario.weathercode[i]);

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-dia";

        const dia = document.createElement("p");
        dia.className = "tarjeta-dia__dia";
        dia.textContent = i === 0 ? "Hoy" : formatearDiaCorto(diario.time[i]);

        const icono = document.createElement("p");
        icono.className = "tarjeta-dia__icono";
        icono.textContent = clima.emoji;
        icono.setAttribute("aria-hidden", "true");
        icono.title = clima.descripcion;

        const temp = document.createElement("p");
        temp.className = "tarjeta-dia__temp";

        const max = document.createElement("span");
        max.className = "tarjeta-dia__temp-max";
        max.textContent = `${Math.round(diario.temperature_2m_max[i])}°`;

        const min = document.createElement("span");
        min.className = "tarjeta-dia__temp-min";
        min.textContent = ` / ${Math.round(diario.temperature_2m_min[i])}°`;

        temp.append(max, min);
        tarjeta.append(dia, icono, temp);
        elementos.pronostico.appendChild(tarjeta);
    }
}

function renderClima(lugar, datos) {
    const actual = datos.current;
    const clima = describirClima(actual.weathercode);

    const ubicacion = lugar.admin && lugar.admin !== lugar.nombre
        ? `${lugar.nombre}, ${lugar.admin} (${lugar.pais})`
        : `${lugar.nombre} (${lugar.pais})`;

    elementos.nombreCiudad.textContent = ubicacion;
    elementos.fechaActual.textContent = formatearFechaLarga(actual.time.slice(0, 10));
    elementos.iconoActual.textContent = clima.emoji;
    elementos.temperaturaActual.textContent = `${Math.round(actual.temperature_2m)}°C`;
    elementos.descripcionActual.textContent = clima.descripcion;
    elementos.vientoActual.textContent = `Viento: ${Math.round(actual.windspeed_10m)} km/h`;
    elementos.humedadActual.textContent = `Humedad: ${actual.relative_humidity_2m} %`;

    renderPronostico(datos.daily);
}

async function ejecutarBusqueda(ciudad) {
    const miId = ++idPeticion;

    if (controladorActual) {
        controladorActual.abort();
    }
    controladorActual = new AbortController();
    const { signal } = controladorActual;

    mostrarCarga();

    try {
        const lugar = await obtenerCoordenadas(ciudad, signal);
        if (miId !== idPeticion) {
            return;
        }

        if (!lugar) {
            mostrarError(`No encontramos la ciudad "${ciudad}". Verifica el nombre e inténtalo de nuevo.`);
            return;
        }

        const datos = await obtenerClima(lugar.lat, lugar.lon, signal);
        if (miId !== idPeticion) {
            return;
        }

        renderClima(lugar, datos);
        mostrarExito();
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        if (error instanceof TypeError) {
            mostrarError("No pudimos conectarnos con el servicio del clima. Revisa tu conexión a internet e inténtalo de nuevo.");
        } else {
            console.error("Error al consultar el clima:", error);
            mostrarError("Ocurrió un error inesperado al obtener el clima. Inténtalo de nuevo más tarde.");
        }
    } finally {
        if (miId === idPeticion) {
            bloquearControles(false);
        }
    }
}

function manejarEnvio(evento) {
    evento.preventDefault();

    const ciudad = elementos.entrada.value.trim();

    if (!ciudad) {
        mostrarError("Escribe el nombre de una ciudad para consultar el clima.");
        return;
    }

    ejecutarBusqueda(ciudad);
}

function inicializar() {
    elementos.formulario.addEventListener("submit", manejarEnvio);
    elementos.entrada.value = CIUDAD_INICIAL;
    ejecutarBusqueda(CIUDAD_INICIAL);
}

document.addEventListener("DOMContentLoaded", inicializar);
